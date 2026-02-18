import requests
import json

API_URL = "http://localhost:5285/api/teams"

def get_teams():
    try:
        response = requests.get(API_URL, timeout=10)
        response.raise_for_status()
        teams = response.json()
        
        print(f"Found {len(teams)} teams:")
        for team in teams:
            print(f"ID: {team['id']}, Name: {team['name']}, Sport: {team['sportName']}, Category: {team['category']}")
            
    except Exception as e:
        print(f"Error fetching teams: {e}")

if __name__ == "__main__":
    get_teams()
