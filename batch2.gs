// Helper function to encode parameters
function encodeParams(params) {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

async function batchRequest(requests, accessToken) {
  const url = 'https://graph.facebook.com/v20.0/';
  const batchSize = 50; // Meta allows max 50 requests per batch
  const batches = [];
  
  // Split requests into batches of 50
  for (let i = 0; i < requests.length; i += batchSize) {
    const batchRequests = requests.slice(i, i + batchSize).map(req => ({
      method: req.method,
      relative_url: req.relative_url,
      body: req.body ? encodeParams(req.body) : undefined,
      headers: req.headers
    }));

    const payload = {
      access_token: accessToken,
      batch: JSON.stringify(batchRequests),
      include_headers: false
    };

    logStep('batchRequest', `Outgoing payload: ${JSON.stringify(payload)}`);

    const response = await UrlFetchApp.fetch(url, {
      method: 'POST',
      payload: payload,
      muteHttpExceptions: true
    });

    const responseText = response.getContentText();
    logStep('batchRequest', `Incoming response: ${responseText}`);

    const batchResults = JSON.parse(responseText);
    batches.push(...batchResults);
  }

  return batches;
}


function logStep(step, details) {
    console.log(`[${step}] ${details}`);
}

async function updateSheetStatus(platform, row, status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const column = platform.toLowerCase() === 'facebook' ? 12 : 13;
  
  logStep('updateSheetStatus', `Updating ${platform} status for row ${row}: ${status}`);
  
  try {
    sheet.getRange(row, column).setValue(status);
    logStep('updateSheetStatus', `Status updated successfully`);
  } catch (error) {
    logStep('updateSheetStatus', `Error updating status: ${error.message}`);
  }
}

async function postToSocialMedia() {
  console.time("postToSocialMedia");
  logStep('postToSocialMedia', "Starting postToSocialMedia function");

  if (!businessId || !accessToken) {
    throw new Error("Business ID or Access Token is missing.");
  }

  const pages = await retryOperation(() => FacebookAPI.getPages(businessId, accessToken));
  if (!pages || pages.length === 0) {
    throw new Error("No pages found or an error occurred.");
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const instagramBatch = [];
  const facebookBatch = [];

  sheet.getRange(2, 12, sheet.getLastRow() - 1, 2).clearContent();

  for (let i = 1; i < data.length; i++) {
    const [, , caption, mediaUrl, mediaType, , facebookPageId, instagramAccountId, , facebookTickbox, instagramTickbox] = data[i];
    
    logStep('postToSocialMedia', `Row ${i + 1}: mediaUrl=${mediaUrl}, mediaType=${mediaType}, facebookTickbox=${facebookTickbox}, instagramTickbox=${instagramTickbox}, facebookPageId=${facebookPageId}, instagramAccountId=${instagramAccountId}`);
    
    if (!mediaUrl) {
      await updateSheetStatus('facebook', i + 1, "Media URL is missing");
      await updateSheetStatus('instagram', i + 1, "Media URL is missing");
      continue;
    }

    const upperMediaType = mediaType.toUpperCase();
    
    if (instagramTickbox && instagramAccountId && ['IMAGE', 'REELS', 'VIDEO'].includes(upperMediaType)) {
      instagramBatch.push({ accountId: instagramAccountId, mediaUrl, caption, row: i + 1, mediaType: upperMediaType });
    } else if (instagramTickbox && !instagramAccountId) {
      await updateSheetStatus('instagram', i + 1, "Instagram Account ID is missing");
    }

    if (facebookTickbox && facebookPageId) {
      const page = pages.find(p => p.id === facebookPageId.toString());
      if (page) {
        facebookBatch.push({ pageId: page.id, accessToken: page.access_token, mediaUrl, caption, row: i + 1, mediaType: upperMediaType });
      } else {
        await updateSheetStatus('facebook', i + 1, "Facebook page not found");
      }
    } else if (facebookTickbox && !facebookPageId) {
      await updateSheetStatus('facebook', i + 1, "Facebook Page ID is missing");
    }
  }

  logStep('postToSocialMedia', `Number of Instagram rows to process: ${instagramBatch.length}`);
  logStep('postToSocialMedia', `Number of Facebook rows to process: ${facebookBatch.length}`);

  // Process batches
  try {
    await Promise.all([
      processInstagramBatch(instagramBatch),
      processFacebookBatch(facebookBatch)
    ]);
    logStep('postToSocialMedia', "All batches processed successfully");
  } catch (error) {
    logStep('postToSocialMedia', `Error processing batches: ${error.message}`);
  } finally {
    const elapsedTime = console.timeEnd("postToSocialMedia");
    const totalPosts = instagramBatch.length + facebookBatch.length;
    const avgTimePerPost = totalPosts > 0 ? elapsedTime / totalPosts : 0;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = ((elapsedTime % 60000) / 1000).toFixed(0);
    const avgMinutes = Math.floor(avgTimePerPost / 60000);
    const avgSeconds = ((avgTimePerPost % 60000) / 1000).toFixed(0);
    logStep('postToSocialMedia', `Elapsed time: ${minutes} minutes and ${seconds} seconds`);
    logStep('postToSocialMedia', `Average time per post: ${avgMinutes} minutes and ${avgSeconds} seconds`);
  }
}

const FacebookAPI = {
  getPages: async function(businessId, accessToken) {
    logStep('getPages', `Fetching pages for business: businessId=${businessId}`);
    let pages = [];
    let url = `https://graph.facebook.com/v20.0/${businessId}/owned_pages?access_token=${encodeURIComponent(accessToken)}&fields=id,access_token,name&limit=100`;

    while (url) {
      const response = await UrlFetchApp.fetch(url, { 'muteHttpExceptions': true });
      const jsonResponse = JSON.parse(response.getContentText());
      
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

async function retryOperation(operation, maxRetries = 3, retryInterval = 5000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      logStep('retryOperation', `Attempt ${attempt} failed: ${error.message}. Retrying in ${retryInterval / 1000} seconds...`);
      await new Promise(resolve => Utilities.sleep(retryInterval));
    }
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation(operation, maxRetries = 3, delayMs = 10000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(delayMs);
    }
  }
}
const COOLDOWN_TIME = 10000; // 10 seconds cooldown

async function cooldown() {
  const start = Date.now();
  return {
    wait: async () => {
      const elapsed = Date.now() - start;
      if (elapsed < COOLDOWN_TIME) {
        await new Promise(resolve => setTimeout(resolve, COOLDOWN_TIME - elapsed));
      }
    }
  };
}
function safeJsonParse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}

function extractErrorInfo(result) {
  if (!result) return 'No response received';
  if (result.error) return JSON.stringify(result.error);
  if (result.body) {
    try {
      const parsed = JSON.parse(result.body);
      if (parsed.error) return JSON.stringify(parsed.error);
      return JSON.stringify(parsed);
    } catch (e) {
      return result.body;
    }
  }
  return JSON.stringify(result);
}

async function processInstagramBatch(batch) {
  logStep('processInstagramBatch', `Processing ${batch.length} Instagram items`);
  const imageBatch = batch.filter(item => item.mediaType === 'IMAGE');
  const reelBatch = batch.filter(item => ['REELS', 'VIDEO'].includes(item.mediaType));

  logStep('processInstagramBatch', 'Creating media containers...');
  const createRequests = [
    ...imageBatch.map(item => ({
      method: 'POST',
      relative_url: `${item.accountId}/media`,
      body: {
        media_type: 'IMAGE',
        image_url: item.mediaUrl,
        caption: item.caption,
        access_token: accessToken
      }
    })),
    ...reelBatch.map(item => ({
      method: 'POST',
      relative_url: `${item.accountId}/media`,
      body: {
        media_type: 'REELS',
        video_url: item.mediaUrl,
        caption: item.caption,
        access_token: accessToken
      }
    }))
  ];

  if (createRequests.length === 0) {
    logStep('processInstagramBatch', 'No media to create.');
    return [];
  }

  const createResults = await batchRequest(createRequests, accessToken);
  logStep('processInstagramBatch', 'Media containers created.');

  const mediaIds = [];

  for (let i = 0; i < createResults.length; i++) {
    const result = createResults[i];
    const item = batch[i];
    try {
      if (!result) {
        throw new Error(`No response received for media creation`);
      }
      if (result.error) {
        throw new Error(`API error: ${JSON.stringify(result.error)}`);
      }
      if (!result.body) {
        throw new Error(`Empty response body from media creation`);
      }
      const data = safeJsonParse(result.body);
      logStep('processInstagramBatch', `Parsed data for item ${i}: ${JSON.stringify(data)}`);
      if (!data) {
        throw new Error(`Invalid JSON in response: ${result.body}`);
      }
      if (!data.id) {
        throw new Error(`No media ID in response: ${JSON.stringify(data)}`);
      }
      mediaIds.push({ id: data.id, index: i });
      await updateSheetStatus(
        'instagram',
        item.row,
        `Media created successfully: ${data.id}`
      );
      logStep('processInstagramBatch', `Media created successfully for item ${i}: ${data.id}`);
    } catch (error) {
      console.error(`Error creating media for item ${i}: ${error.message}`);
      console.error(`Full response: ${extractErrorInfo(result)}`);
      await updateSheetStatus(
        'instagram',
        item.row,
        `Error creating media: ${error.message}. Details: ${extractErrorInfo(result)}`
      );
      logStep('processInstagramBatch', `Error creating media for item ${i}: ${error.message}`);
    }
  }

  logStep('processInstagramBatch', 'Cooldown after media creation...');
  const cooldownTimer = await cooldown();
  await cooldownTimer.wait();

  logStep('processInstagramBatch', 'Publishing media...');
  const publishRequests = mediaIds.map(({ id, index }) => ({
    method: 'POST',
    relative_url: `${batch[index].accountId}/media_publish`,
    body: {
      creation_id: id,
      access_token: accessToken
    }
  }));

  const publishResults = await batchRequest(publishRequests, accessToken);
  logStep('processInstagramBatch', 'Media published.');

  for (let i = 0; i < publishResults.length; i++) {
    const result = publishResults[i];
    const { index } = mediaIds[i];
    const item = batch[index];
    try {
      if (!result.body) {
        throw new Error(`Invalid publish response: ${JSON.stringify(result)}`);
      }
      const data = safeJsonParse(result.body);
      if (!data || !data.id) {
        throw new Error(`Failed to publish media: ${JSON.stringify(data)}`);
      }
      const postType = item.mediaType === 'REELS' ? 'reel' : 'p';
      await updateSheetStatus(
        'instagram', 
        item.row, 
        `Posted successfully: https://www.instagram.com/${postType}/${data.id}`
      );
      logStep('processInstagramBatch', `Media published successfully for item ${index}: ${data.id}`);
    } catch (error) {
      console.error(`Error publishing media for item ${index}: ${error.message}`);
      await updateSheetStatus(
        'instagram',
        item.row,
        `Error publishing: ${error.message}`
      );
      logStep('processInstagramBatch', `Error publishing media for item ${index}: ${error.message}`);
    }
  }

  return publishResults;
}

async function processFacebookBatch(batch) {
  logStep('processFacebookBatch', `Processing ${batch.length} Facebook items`);
  const imageBatch = batch.filter(item => item.mediaType === 'IMAGE');
  const videoBatch = batch.filter(item => item.mediaType === 'VIDEO');
  const reelBatch = batch.filter(item => item.mediaType === 'REELS');

  logStep('processFacebookBatch', 'Processing images...');
  const imageRequests = imageBatch.map(item => ({
    method: 'POST',
    relative_url: `${item.pageId}/photos`,
    body: {
      url: item.mediaUrl,
      caption: item.caption,
      access_token: item.accessToken
    }
  }));

  logStep('processFacebookBatch', 'Processing videos...');
  const videoRequests = videoBatch.map(item => ({
    method: 'POST',
    relative_url: `${item.pageId}/videos`,
    body: {
      file_url: item.mediaUrl,
      description: item.caption,
      access_token: item.accessToken
    }
  }));

  logStep('processFacebookBatch', 'Executing image and video batch requests...');
  const [imageResults, videoResults] = await Promise.all([
    imageRequests.length > 0 ? batchRequest(imageRequests, accessToken) : [],
    videoRequests.length > 0 ? batchRequest(videoRequests, accessToken) : []
  ]);
  logStep('processFacebookBatch', 'Image and video batch requests completed.');

  for (let i = 0; i < imageBatch.length; i++) {
    const item = imageBatch[i];
    const result = imageResults[i];
    try {
      if (!result.body) {
        throw new Error(`Invalid image response: ${JSON.stringify(result)}`);
      }
      const data = safeJsonParse(result.body);
      if (!data || !data.id) {
        throw new Error(`Failed to post image: ${JSON.stringify(data)}`);
      }
      await updateSheetStatus(
        'facebook',
        item.row,
        `Posted successfully: https://www.facebook.com/${data.id}`
      );
      logStep('processFacebookBatch', `Image posted successfully for item ${i}: ${data.id}`);
    } catch (error) {
      console.error(`Error posting image for item ${i}: ${error.message}`);
      await updateSheetStatus(
        'facebook',
        item.row,
        `Error posting image: ${error.message}`
      );
      logStep('processFacebookBatch', `Error posting image for item ${i}: ${error.message}`);
    }
  }

  for (let i = 0; i < videoBatch.length; i++) {
    const item = videoBatch[i];
    const result = videoResults[i];
    try {
      if (!result.body) {
        throw new Error(`Invalid video response: ${JSON.stringify(result)}`);
      }
      const data = safeJsonParse(result.body);
      if (!data || !data.id) {
        throw new Error(`Failed to post video: ${JSON.stringify(data)}`);
      }
      await updateSheetStatus(
        'facebook',
        item.row,
        `Video posted successfully: https://www.facebook.com/${data.id}`
      );
      logStep('processFacebookBatch', `Video posted successfully for item ${i}: ${data.id}`);
    } catch (error) {
      console.error(`Error posting video for item ${i}: ${error.message}`);
      await updateSheetStatus(
        'facebook',
        item.row,
        `Error posting video: ${error.message}`
      );
      logStep('processFacebookBatch', `Error posting video for item ${i}: ${error.message}`);
    }
  }

  let reelResults = [];
  if (reelBatch.length > 0) {
    logStep('processFacebookBatch', 'Creating reel containers...');
    const reelContainerRequests = reelBatch.map(item => ({
      method: 'POST',
      relative_url: `${item.pageId}/video_reels`,
      body: {
        upload_phase: 'start',
        access_token: item.accessToken
      }
    }));

    const reelContainerResults = await batchRequest(reelContainerRequests, accessToken);
    logStep('processFacebookBatch', 'Reel containers created.');

    const videoIds = [];

    for (let i = 0; i < reelContainerResults.length; i++) {
      const result = reelContainerResults[i];
      const item = reelBatch[i];
      try {
        if (!result) {
          throw new Error(`No response received for reel container creation`);
        }
        if (result.error) {
          throw new Error(`API error: ${JSON.stringify(result.error)}`);
        }
        if (!result.body) {
          throw new Error(`Empty response body from reel container creation`);
        }
        const data = safeJsonParse(result.body);
        logStep('processFacebookBatch', `Parsed data for item ${i}: ${JSON.stringify(data)}`);
        if (!data) {
          throw new Error(`Invalid JSON in response: ${result.body}`);
        }
        if (!data.video_id) {
          throw new Error(`No video ID in response: ${JSON.stringify(data)}`);
        }
        videoIds.push({ id: data.video_id, index: i });
        await updateSheetStatus(
          'facebook',
          item.row,
          `Reel container created: ${data.video_id}`
        );
        logStep('processFacebookBatch', `Reel container created successfully for item ${i}: ${data.video_id}`);
      } catch (error) {
        console.error(`Error creating reel container for item ${i}: ${error.message}`);
        console.error(`Full response: ${extractErrorInfo(result)}`);
        await updateSheetStatus(
          'facebook',
          item.row,
          `Error creating reel container: ${error.message}. Details: ${extractErrorInfo(result)}`
        );
        logStep('processFacebookBatch', `Error creating reel container for item ${i}: ${error.message}`);
      }
    }
    
    logStep('processFacebookBatch', 'Uploading reel videos...');
    for (const { id, index } of videoIds) {
      const item = reelBatch[index];
      const uploadUrl = `https://rupload.facebook.com/video-upload/v21.0/${id}`;
      try {
        const uploadResponse = await UrlFetchApp.fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `OAuth ${item.accessToken}`,
            'file_url': item.mediaUrl
          },
          muteHttpExceptions: true
        });
        
        const uploadResult = safeJsonParse(uploadResponse.getContentText());
        if (!uploadResult || !uploadResult.success) {
          throw new Error(`Failed to upload video: ${JSON.stringify(uploadResult)}`);
        }
        
        await updateSheetStatus(
          'facebook',
          item.row,
          `Reel video uploaded successfully: ${id}`
        );
        logStep('processFacebookBatch', `Reel video uploaded successfully for item ${index}: ${id}`);
      } catch (error) {
        console.error(`Error uploading video for item ${index}: ${error.message}`);
        await updateSheetStatus(
          'facebook',
          item.row,
          `Error uploading reel video: ${error.message}`
        );
        logStep('processFacebookBatch', `Error uploading reel video for item ${index}: ${error.message}`);
        videoIds[index] = null;
      }
    }

    logStep('processFacebookBatch', 'Cooldown after video uploads...');
    const cooldownTimer = await cooldown();
    await cooldownTimer.wait();

    logStep('processFacebookBatch', 'Publishing reels...');
    const publishRequests = videoIds.filter(Boolean).map(({ id, index }) => ({
      method: 'POST',
      relative_url: `${reelBatch[index].pageId}/video_reels`,
      body: {
        video_id: id,
        upload_phase: 'finish',
        video_state: 'PUBLISHED',
        description: reelBatch[index].caption,
        access_token: reelBatch[index].accessToken
      }
    }));

    reelResults = await batchRequest(publishRequests, accessToken);
    logStep('processFacebookBatch', 'Reels published.');

    for (let i = 0; i < reelResults.length; i++) {
      const result = reelResults[i];
      const { index } = videoIds[i];
      const item = reelBatch[index];
      try {
        if (!result.body) {
          throw new Error(`Invalid reel response: ${JSON.stringify(result)}`);
        }
        const data = safeJsonParse(result.body);
        if (!data || !data.success) {
          throw new Error(`Failed to publish reel: ${JSON.stringify(data)}`);
        }
        await updateSheetStatus(
          'facebook',
          item.row,
          `Reel posted successfully: video_id=${data.video_id}`
        );
        logStep('processFacebookBatch', `Reel posted successfully for item ${index}: video_id=${data.video_id}`);
      } catch (error) {
        console.error(`Error publishing reel for item ${index}: ${error.message}`);
        await updateSheetStatus(
          'facebook',
          item.row,
          `Error publishing reel: ${error.message}`
        );
        logStep('processFacebookBatch', `Error publishing reel for item ${index}: ${error.message}`);
      }
    }
  }

  return {
    imageResults,
    videoResults,
    reelResults
  };
}