function getAndWriteMetaPages() {
  var helperSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Helper");
  var lastRow = helperSheet.getLastRow();
  
  // Fetch Pages, Page Access Tokens, and Instagram Accounts from Meta
  var pages = fetchMetaPages();
  
  if (!pages || pages.length === 0) {
    Logger.log('No pages found.');
    return;
  }
  
  var pageData = pages.map(function(page) {
    return [
      page.name,
      page.id,
      page.connected_instagram_account ? page.connected_instagram_account.id : ''
    ];
  });

  // Write fetched pages to the helper sheet starting from the first empty row
  var startRow = lastRow + 1;
  helperSheet.getRange(startRow, 1, pageData.length, 3).setValues(pageData);

  Logger.log('Fetched Pages: ' + pages.length);
}

// Helper function to fetch the pages and related info from Meta using the Graph API
function fetchMetaPages() {
  var accessToken = 'EAAGqJkJgmwgBO4o05kEvsYFvwCVcEF17TMwv8t3QXYr22KaLVHsWxN177gzZAGrysPQ6Laf9z9Xdyz3fZCjKH6e6APZCmEkdy2oeuk7o7IxkUnHKHQCR20tgwYbQkZCIZBVgzEIg48HA9AGFTF4AXVd8rGndZA0krnKrYUY4xaB5iAX6ZCdgFBeZCzkJ'; 
  var businessId = '1094536118662967';//'1000350134913794'; 
  var url = `https://graph.facebook.com/v20.0/${businessId}/owned_pages?fields=name,id,connected_instagram_account&access_token=${accessToken}`;
  var options = {
    'method': 'get',
    'muteHttpExceptions': true
  };
  
  var allPages = [];
  
  try {
    while (url) {
      var response = UrlFetchApp.fetch(url, options);
      var data = JSON.parse(response.getContentText());
      if (data && data.data) {
        allPages = allPages.concat(data.data);
        url = data.paging && data.paging.next ? data.paging.next : null;
      } else {
        url = null;
      }
    }
  } catch (error) {
    Logger.log('Error fetching pages: ' + error.message);
  }
  
  return allPages;
}