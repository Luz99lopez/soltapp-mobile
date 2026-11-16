from search_wikimedia_and_unsplash import search_wikimedia

for q in ["Honda XR", "Honda XR150L", "Honda CRF", "Honda motorcycle off-road", "Honda dirt bike", "Honda XR250"]:
    print(f"\n=== Query: {q} ===")
    res = search_wikimedia(q, limit=6)
    for r in res:
        print(f"- {r['title']} : {r['url']}")
