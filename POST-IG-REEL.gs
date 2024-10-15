async function processInstagramReelBatch(batch) {
    logStep('processInstagramReelBatch', "Processing Instagram reel batch");
    logStep('processInstagramReelBatch', `Received batch: ${JSON.stringify(batch)}`);
    const results = [];
    for (const item of batch) {
        try {
            logStep('processInstagramReelBatch', `Processing item for row ${item.row}`);
            logStep('processInstagramReelBatch', `Item details: ${JSON.stringify(item)}`);

            logStep('processInstagramReelBatch', `Creating reel container for row ${item.row}`);
            const containerResponse = await createReelContainer(item.accountId, item.caption, item.mediaUrl);
            logStep('processInstagramReelBatch', `Received container response: ${JSON.stringify(containerResponse)}`);

            if (containerResponse && containerResponse.id) {
                logStep('processInstagramReelBatch', `Publishing Instagram reel for row ${item.row}`);
                const publishResponse = await publishInstagramReel(item.accountId, containerResponse.id);
                logStep('processInstagramReelBatch', `Received publish response: ${JSON.stringify(publishResponse)}`);

                if (publishResponse && publishResponse.id) {
                    logStep('processInstagramReelBatch', `Row ${item.row}: Instagram reel posted successfully`);
                    await updateSheetStatus('instagram', item.row, `Reel posted successfully: https://www.instagram.com/reel/${publishResponse.id}`);
                    results.push({ platform: 'instagram', row: item.row, status: 'success', id: publishResponse.id });
                } else {
                    throw new Error("Failed to publish Instagram reel");
                }
            } else {
                throw new Error("Failed to create reel container");
            }
        } catch (error) {
            logStep('processInstagramReelBatch', `Error processing Instagram reel for row ${item.row}: ${error.message}`);
            await updateSheetStatus('instagram', item.row, `Error: ${error.message}`);
            results.push({ platform: 'instagram', row: item.row, status: 'error', error: error.message });
        }
    }
    logStep('processInstagramReelBatch', `Finished processing batch. Results: ${JSON.stringify(results)}`);
    return results;
}

async function createReelContainer(accountId, caption, videoUrl) {
    try {
        logStep('createReelContainer', `Creating reel container: accountId=${accountId}, caption=${caption}`);
        const url = `https://graph.facebook.com/v20.0/${accountId}/media`;
        const payload = {
            'access_token': accessToken,
            'media_type': 'REELS',
            'video_url': videoUrl,
            'caption': caption
        };

        logStep('createReelContainer', `Outgoing payload: ${JSON.stringify(payload)}`);
        const options = {
            'method': 'post',
            'payload': payload,
            'muteHttpExceptions': true
        };

        const response = await UrlFetchApp.fetch(url, options);
        const responseText = response.getContentText();
        logStep('createReelContainer', `Response: ${responseText}`);
        
        const parsedResponse = JSON.parse(responseText);
        if (!parsedResponse.id) {
            throw new Error(`Failed to create reel container. Response: ${responseText}`);
        }
        return parsedResponse;
    } catch (error) {
        logStep('createReelContainer', `Error: ${error.message}`);
        throw error;
    }
}

async function publishInstagramReel(accountId, mediaId) {
    logStep('publishInstagramReel', `Publishing Instagram reel: accountId=${accountId}, mediaId=${mediaId}`);
    const url = `https://graph.facebook.com/v20.0/${accountId}/media_publish`;
    const payload = {
        'access_token': accessToken,
        'creation_id': mediaId
    };

    logStep('publishInstagramReel', `Request payload: ${JSON.stringify(payload)}`);
    const options = {
        'method': 'post',
        'payload': payload,
        'muteHttpExceptions': true
    };

    try {
        const response = await UrlFetchApp.fetch(url, options);
        const responseText = response.getContentText();
        logStep('publishInstagramReel', `Response: ${responseText}`);
        return JSON.parse(responseText);
    } catch (error) {
        logStep('publishInstagramReel', `Error: ${error.message}`);
        throw error;
    }
}