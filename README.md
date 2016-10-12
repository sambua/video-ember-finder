# video-ember-finder

### This is test project for finding content by crawling websites

### Features
- In this node script, you can easliy stream very big size json file, tested with 360mb size file.
- Crawl web sites and record which one contains words in array 'searchindContent'
- Records site name and url to searched_container.csv ('searched_container.txt') file line-per line

### Need add new file
- JSON file from tmp is missing, structure should be 
  '{root:[{'name':'Name of company', 'homepage_url': 'http://example.com'}, {'name': 'Another company', 'homepage_url': 'http://example2.com'} ...]}'

## To be able use run cmd files below
- `npm install`
- `npm run server`