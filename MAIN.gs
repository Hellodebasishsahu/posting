
async function postToSocialMedia() {
    console.time("postToSocialMedia");
    logStep('postToSocialMedia', "Starting postToSocialMedia function");

    if (!businessId || !accessToken) {
        logStep('postToSocialMedia', "Business ID or Access Token is missing.");
        console.timeEnd("postToSocialMedia");
        return;
    }

    logStep('postToSocialMedia', "Fetching pages for business ID: " + businessId);
    const pages = FacebookAPI.getPages(businessId, accessToken);
    if (!pages || pages.length === 0) {
        logStep('postToSocialMedia', "No pages found or an error occurred.");
        console.timeEnd("postToSocialMedia");
        return;
    }
    logStep('postToSocialMedia', "Fetched pages: " + JSON.stringify(pages));

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    logStep('postToSocialMedia', "Fetched data from sheet: " + JSON.stringify(data));

    // Prepare batches
    const igImageCreationBatch = [];
    const igReelCreationBatch = [];
    const fbImageBatch = [];
    const fbVideoBatch = [];

    // Clear status columns
    logStep('postToSocialMedia', "Clearing status columns");
    sheet.getRange(2, 12, sheet.getLastRow() - 1, 2).clearContent();

    for (let i = 1; i < data.length; i++) {
    const [, , caption, mediaUrl, mediaType, , facebookPageId, instagramAccountId, , facebookTickbox, instagramTickbox] = data[i];
    logStep('postToSocialMedia', `Processing row ${i + 1}: mediaUrl=${mediaUrl}, mediaType=${mediaType}, facebookPageId=${facebookPageId}, instagramAccountId=${instagramAccountId}, facebookTickbox=${facebookTickbox}, instagramTickbox=${instagramTickbox}`);

    if (!mediaUrl) {
        logStep('postToSocialMedia', `Row ${i + 1}: Media URL is missing`);
        sheet.getRange(i + 1, 12, 1, 2).setValue("Media URL is missing");
        continue;
    }

    const lowerMediaType = mediaType.toLowerCase();
    
    if (instagramTickbox && instagramAccountId) {
        if (lowerMediaType === 'image') {
            igImageCreationBatch.push({ accountId: instagramAccountId, mediaUrl, caption, row: i + 1 });
            logStep('postToSocialMedia', `Row ${i + 1}: Added to Instagram image batch`);
        } else if (lowerMediaType === 'reel' || lowerMediaType === 'video') {
            igReelCreationBatch.push({ accountId: instagramAccountId, mediaUrl, caption, row: i + 1 });
            logStep('postToSocialMedia', `Row ${i + 1}: Added to Instagram reel batch`);
        } else {
            logStep('postToSocialMedia', `Row ${i + 1}: Unrecognized media type for Instagram: ${mediaType}`);
        }
    } else {
        logStep('postToSocialMedia', `Row ${i + 1}: Skipped Instagram (Tickbox: ${instagramTickbox}, AccountId: ${instagramAccountId})`);
    }

    if (facebookTickbox && facebookPageId) {
    const page = pages.find(p => p.id === facebookPageId.toString());
    if (page) {
        if (lowerMediaType === 'image') {
            fbImageBatch.push({ pageId: page.id, accessToken: page.access_token, mediaUrl, caption, row: i + 1 });
            logStep('postToSocialMedia', `Row ${i + 1}: Added to Facebook image batch`);
        } else if (lowerMediaType === 'video' || lowerMediaType === 'reel') {
            fbVideoBatch.push({ pageId: page.id, accessToken: page.access_token, mediaUrl, caption, row: i + 1, mediaType: lowerMediaType });
            logStep('postToSocialMedia', `Row ${i + 1}: Added to Facebook ${lowerMediaType} batch`);
        } else {
            logStep('postToSocialMedia', `Row ${i + 1}: Unrecognized media type for Facebook: ${mediaType}`);
        }
    } else {
        logStep('postToSocialMedia', `Row ${i + 1}: Facebook page not found (Page ID: ${facebookPageId})`);
        sheet.getRange(i + 1, 12).setValue("Facebook page not found");
    }
} else {
        logStep('postToSocialMedia', `Row ${i + 1}: Skipped Facebook (Tickbox: ${facebookTickbox}, PageId: ${facebookPageId})`);
    }
}

  logStep('postToSocialMedia', "Processing batches in parallel");
  logStep('postToSocialMedia', `Batch sizes: 
  Instagram Images: ${igImageCreationBatch.length}
  Instagram Reels: ${igReelCreationBatch.length}
  Facebook Images: ${fbImageBatch.length}
  Facebook Reels: ${fbVideoBatch.length}`);

const batchPromises = [];

if (igImageCreationBatch.length > 0) {
    batchPromises.push(processInstagramImageBatch(igImageCreationBatch));
}
if (igReelCreationBatch.length > 0) {
    batchPromises.push(processInstagramReelBatch(igReelCreationBatch));
}
if (fbImageBatch.length > 0) {
    batchPromises.push(processFacebookImageBatch(fbImageBatch));
}
if (fbVideoBatch.length > 0) {
    batchPromises.push(processFacebookVideoBatch(fbVideoBatch));
}

if (batchPromises.length === 0) {
    logStep('postToSocialMedia', "No batches to process");
    console.timeEnd("postToSocialMedia");
    return;
}

Promise.all(batchPromises)
    .then(() => {
        logStep('postToSocialMedia', "All batches processed");
        console.timeEnd("postToSocialMedia");
    })
    .catch(error => {
        logStep('postToSocialMedia', "Error processing batches: " + error.message);
        console.timeEnd("postToSocialMedia");
    });
}
// ///
// try {
//         await processInstagramReelBatch(igReelCreationBatch);
//         await processFacebookImageBatch(fbImageBatch);
//         await processFacebookReelBatch(fbVideoBatch);
//         await processInstagramImageBatch(igImageCreationBatch);

//         logStep('postToSocialMedia', "All batches processed");
//     } catch (error) {
//         logStep('postToSocialMedia', "Error processing batches: " + error.message);
//     } finally {
//         console.timeEnd("postToSocialMedia");
//     }
// }
////
function logAdvanced(message, data = null) {
    const timestamp = new Date().toISOString();
    if (data) {
        console.log(`[${timestamp}] ${message}: ${JSON.stringify(data)}`);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

const FacebookAPI = {
    getPages: function(businessId, accessToken) {
        logStep('getPages', `Fetching pages for business: businessId=${businessId}`);
        let pages = [];
        let url = `https://graph.facebook.com/v20.0/${businessId}/owned_pages?access_token=${encodeURIComponent(accessToken)}&fields=id,access_token,name&limit=100`;

        while (url) {
            const response = UrlFetchApp.fetch(url, { 'muteHttpExceptions': true });
            const jsonResponse = JSON.parse(response.getContentText());
            logStep('getPages', `Response: ${response.getContentText()}`);

            if (jsonResponse.data) {
                pages = pages.concat(jsonResponse.data.map(page => ({
                    id: page.id,
                    name: page.name,
                    access_token: page.access_token
                })));
            } else {
                throw new Error("Failed to fetch pages: " + response.getContentText());
            }

            url = jsonResponse.paging && jsonResponse.paging.next ? jsonResponse.paging.next : null;
        }

        return pages;
    }
};

function publishInstagramMedia(accountId, mediaId) {
    logStep('publishInstagramMedia', `Publishing Instagram media: accountId=${accountId}, mediaId=${mediaId}`);
    const url = `https://graph.facebook.com/v20.0/${accountId}/media_publish`;
    const payload = {
        'access_token': accessToken,
        'creation_id': mediaId
    };

    logStep('publishInstagramMedia', `Request payload: ${JSON.stringify(payload)}`);

    const options = {
        'method': 'post',
        'payload': payload,
        'muteHttpExceptions': true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    logStep('publishInstagramMedia', `Response: ${responseText}`);

    return JSON.parse(responseText);
}

function updateSheetStatus(platform, row, status) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    let column;
    
    if (platform.toLowerCase() === 'facebook') {
        column = 12; // Column J
    } else if (platform.toLowerCase() === 'instagram') {
        column = 13; // Column K
    } else {
        throw new Error(`Invalid platform: ${platform}`);
    }
    
    logStep('updateSheetStatus', `Updating ${platform} status for row ${row}: ${status}`);
    
    try {
        sheet.getRange(row, column).setValue(status);
        logStep('updateSheetStatus', `Status updated successfully`);
    } catch (error) {
        logStep('updateSheetStatus', `Error updating status: ${error.message}`);
        // Optionally, you could throw this error to be caught by the calling function
        // throw error;
    }
}