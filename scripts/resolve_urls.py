import urllib.request

urls = [
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHJFSndn61A7gcbrzqCv4zOlrK1P-FBhAEzaPfbwRg7mZjKdwbENIBd_eaNZS78BThrPJ2VFsB-ZXud2ssSOGWqMk1ZbV8bYKypVA4f94iYqrpMVWCq9-MxUa_OWEpgIC0zR4Lljo04eDbzHegP2l0=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEDcjR8TKJHSxg9CNYU6VQsg-3xOuXrSsC0By0hziF0rlqEMJd-muKJQ6x14BXc59HjSVrVGUba84swl96veqKCsRMopSOFTIIFlJX2W0hgBjX7U_MkYY_sHbYm1THQvrpIEL-pAJZKToURpzwCT3C_HAuJTKgOuxCa9CLT6k5r2g3IjPPx6Tc="
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        print("Resolved:", res.geturl())
    except Exception as e:
        print("Error:", e)
