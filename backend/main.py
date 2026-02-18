from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
import uvicorn
import os
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database credentials provided by user
DB_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "database": "postgres",
    "user": "postgres",
    "password": "password"
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

# fixing accuracy with the ranking logic - need to test on multiple cases , check notepad 
def normalize(text: str) -> str:
    """Normalize a product name for comparison: uppercase, strip extra spaces, merge known patterns."""
    text = text.upper().strip()
    text = re.sub(r'\s+', ' ', text)           # collapse multiple spaces
    text = re.sub(r'\s*&\s*', ' & ', text)     # normalize ampersand spacing
    text = text.replace(' AND ', ' & ')        # "and" -> "&"
    # Merge known brand names that AI might split: "7 UP" -> "7UP", "MOUNTAIN DEW" stays
    text = re.sub(r'(\d)\s+(UP|PC|PCS)', r'\1\2', text, flags=re.IGNORECASE)  # "7 UP" -> "7UP", "8 PC" -> "8PC"
    return text


def word_overlap_score(query_words: set, candidate_words: set) -> float:
    """Score based on how many query words appear in the candidate."""
    if not query_words:
        return 0.0
    matched = query_words & candidate_words
    # Weighted: full overlap of query = 1.0, partial = fraction
    return len(matched) / len(query_words)
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1

@app.get("/api/products")
async def get_products(
    category: str = Query(None),
    type: str = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    name: str = Query(None),
    id: str = Query(None)
):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT * FROM products WHERE 1=1"
        params = []
        
        if id:
            query += " AND id::text = %s"
            params.append(id)

        if name:
            query += " AND name ILIKE %s"
            params.append(f"%{name}%")
        
        if category and category != "All":
            query += " AND category ILIKE %s"
            params.append(category)
        
        if type:
            query += " AND type ILIKE %s"
            params.append(type)
            
        if min_price is not None:
            query += " AND price >= %s"
            params.append(min_price)
            
        if max_price is not None:
            query += " AND price <= %s"
            params.append(max_price)
            
        print(f"Executing query: {query}")
        print(f"With params: {params}")
            
        cur.execute(query, params)
        products = cur.fetchall()
        
        cur.close()
        conn.close()
        return products
    except Exception as e:
        print(f"Database error: {e}")
        return {"error": str(e)}


@app.get("/api/products/search")
async def search_product(q: str = Query(..., description="The product name or query to fuzzy search")):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        raw_input = q.strip()
        normalized_input = normalize(raw_input)
        query_words = set(normalized_input.split())

        print(f"[FuzzySearch] Query: '{raw_input}'")

        cur.execute("SELECT * FROM products WHERE name ILIKE %s OR name ILIKE %s", 
                   (f"%{raw_input}%", f"%{normalized_input}%"))
        results = cur.fetchall()

        if not results:
            
            cur.execute("SELECT * FROM products")
            all_products = cur.fetchall()
            scored = []
            for p in all_products:
                p_name_norm = normalize(p["name"])
                p_words = set(p_name_norm.split())
                score = word_overlap_score(query_words, p_words)
                if score > 0:
                    scored.append((score, p))
            scored.sort(key=lambda x: x[0], reverse=True)
            results = [item for score, item in scored if score >= 0.5] if scored else []

        if not results:
            cur.close()
            conn.close()
            return []

        # Ranking Logic:
        # 1. Heavily prioritize if name is exactly the query
        # 2. Prioritize shorter names (more "direct" match)
        # 3. Penalize "Combo" or "Meal" if the query doesn't include those words
        
        has_combo_req = "COMBO" in normalized_input or "MEAL" in normalized_input or "BUCKET" in normalized_input
        
        def rank_score(item):
            name = item["name"].upper()
            score = 100
            
            if name == normalized_input:
                score += 1000
            elif normalized_input in name:
                score += 500
                
            score -= len(name)
            
            if not has_combo_req:
                if "COMBO" in name or "MEAL" in name or "BUCKET" in name or " & " in name:
                    score -= 400
            
            return score

        # Sort by rank score
        results.sort(key=rank_score, reverse=True)
        
        cur.close()
        conn.close()
        return results

    except Exception as e:
        print(f"[FuzzySearch] Error: {e}")
        return {"error": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
