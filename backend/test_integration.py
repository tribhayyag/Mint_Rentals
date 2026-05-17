import sys
sys.path.append('../tools')
from housing_listing_scraper import get_housing_listings
import json

# Simulate what the frontend sends when user submits preferences
user_prefs_from_frontend = {
    'max_rent': 1200,
    'general_location': 'Santa Cruz', 
    'destination_address': 'UC Santa Cruz, Santa Cruz, CA',
    'transportation_preference': 'bus',
    'max_commute_minutes': 25,
    'property_type': 'room',
    'roommates': 1,
    'room_type': 'private',
    'amenities': {
        'pet_friendly': 'yes',
        'parking': 'yes',
        'accessible': 'unknown',
        'furnished': 'no',
        'laundry': 'in-unit'
    }
}

# Convert to backend format (what frontend does)
backend_pref_json = {
    'status': 'success',
    'data': {
        'user_query': 'From frontend: I want a private room for 1 person under $1200 in Santa Cruz',
        'preferences': user_prefs_from_frontend,
        'missing_fields': [],
        'assumptions': [],
        'raw_constraints_notes': [],
    },
    'error': None,
}

print('=== Testing end-to-end flow (frontend -> backend) ===')
print('User preferences from frontend:')
print(json.dumps(user_prefs_from_frontend, indent=2))

result = get_housing_listings(
    preference_json=backend_pref_json,
    craigslist_url='https://sfbay.craigslist.org/search/roo?query=room&max_price=1200',
    redfin_url=None,
    max_results_per_source=3
)

print()
print('Backend response:')
print('Status: {}'.format(result['status']))
print('Results count: {}'.format(result['data']['results_count']))
print('Data source: {}'.format(result['data']['data_source']))  
print('Used fallback: {}'.format(result['data']['used_fallback_data']))
print('Source errors: {}'.format(result['data']['source_errors']))

if result['data']['results_count'] > 0:
    print()
    print('=== Real listings received ===')
    for i, listing in enumerate(result['data']['listings'][:2]):
        print('{}. {}...'.format(i+1, listing['title'][:50]))
        print('   Price: ${} | {} | Source: {}'.format(listing['price'], listing['neighborhood'], listing['source']))
        if listing['match_notes']:
            notes = ', '.join(listing['match_notes'][:2])
            print('   Matches: {}'.format(notes))
