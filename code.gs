// Global variables
var thumbnailKeywords = ['thumb', 'thumbnail', 'thum', 'intro', 'jacket', 'plate'];

function showFolderPrompt() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Enter Google Drive Folder Link', 'Please provide the Google Drive folder link:', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() == ui.Button.OK) {
    var folderLink = response.getResponseText();
    try {
      var folderId = extractFolderIdFromLink(folderLink);
      if (folderId) {
        Logger.log(`Folder ID extracted: ${folderId}`);
        processGdriveFolder(folderId);
        ui.alert('Success', 'Media files have been processed and sorted in the sheet.', ui.ButtonSet.OK);
      } else {
        Logger.log('Invalid folder link provided.');
        ui.alert('Error', 'Invalid folder link. Please check the link and try again.', ui.ButtonSet.OK);
      }
    } catch (error) {
      Logger.log(`Error occurred: ${error.message}`);
      ui.alert('Error', 'An error occurred: ' + error.message, ui.ButtonSet.OK);
    }
  } else {
    Logger.log('User canceled the prompt.');
  }
}

function extractFolderIdFromLink(folderLink) {
  var match = folderLink.match(/[-\w]{25,}/);
  var folderId = match ? match[0] : null;
  Logger.log(`Extracted folder ID: ${folderId}`);
  return folderId;
}

function handleFolderPermissions(folderId) {
  var folder = DriveApp.getFolderById(folderId);
  var folderName = folder.getName();
  
  if (isFolderPublic(folder)) {
    Logger.log(`Folder "${folderName}" is already publicly accessible.`);
    return true;
  }
  
  var isSharedDrive = folder.getParents().hasNext() ? false : true;
  
  if (isSharedDrive) {
    Logger.log(`Folder "${folderName}" is in a shared drive and not public. Cannot modify permissions.`);
    return false;
  }

  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    Logger.log(`Successfully set public permissions for folder "${folderName}".`);
    return true;
  } catch (error) {
    Logger.log(`Error setting permissions for folder "${folderName}": ${error.message}`);
    return false;
  }
}

function isFolderPublic(folder) {
  try {
    var access = folder.getSharingAccess();
    var permission = folder.getSharingPermission();
    return (access == DriveApp.Access.ANYONE || access == DriveApp.Access.ANYONE_WITH_LINK) 
           && permission == DriveApp.Permission.VIEW;
  } catch (error) {
    Logger.log(`Error checking folder permissions: ${error.message}`);
    return false;
  }
}

function getPublicFileUrl(file, folderPermissionSet) {
  var fileId = file.getId();
  
  if (!folderPermissionSet) {
    try {
      if (!isFilePublic(file)) {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    } catch (error) {
      Logger.log(`Error setting permissions for file "${file.getName()}": ${error.message}`);
      return file.getUrl();
    }
  }
  
  return "https://drive.google.com/uc?export=download&id=" + fileId;
}

function isFilePublic(file) {
  try {
    var access = file.getSharingAccess();
    var permission = file.getSharingPermission();
    return (access == DriveApp.Access.ANYONE || access == DriveApp.Access.ANYONE_WITH_LINK) 
           && permission == DriveApp.Permission.VIEW;
  } catch (error) {
    Logger.log(`Error checking file permissions: ${error.message}`);
    return false;
  }
}

function processGdriveFolder(folderId) {
  var startTime = new Date();
  var folderPermissionSet = handleFolderPermissions(folderId);
  
  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFiles();
  var mediaFiles = [];
  var thumbnailLink = null;
  var batchSize = 50;

  while (files.hasNext()) {
    var batch = [];
    for (var i = 0; i < batchSize && files.hasNext(); i++) {
      batch.push(files.next());
    }

    var batchResults = batch.map(function(file) {
      var fileName = file.getName();
      var fileType = file.getMimeType();
      var fileUrl = getPublicFileUrl(file, folderPermissionSet);

      if (isPossibleThumbnail(fileName.toLowerCase(), thumbnailKeywords)) {
        thumbnailLink = fileUrl;
        return null;
      }

      return {
        name: fileName,
        url: fileUrl,
        type: fileType.startsWith('image/') ? 'Image' : 'Video'
      };
    }).filter(Boolean);

    mediaFiles = mediaFiles.concat(batchResults);
  }

  var helperSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Helper");
  var lastRow = helperSheet.getLastRow();
  var helperData = helperSheet.getRange(2, 1, lastRow - 1, 4).getValues();
  
  var matchedMedia = mediaFiles.map(function(file) {
    var fileNumber = extractNumberFromFileName(file.name);
    var matchedRow = helperData.find(row => row[0] === fileNumber);
    if (matchedRow) {
      return {
        serial: fileNumber,
        url: file.url,
        facebookId: matchedRow[2],
        pageName: matchedRow[1],
        instagramId: matchedRow[3],
        type: file.type,
        name: file.name
      };
    }
    return null;
  }).filter(Boolean);

  matchedMedia.sort((a, b) => a.serial - b.serial);

  var targetSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  targetSheet.clear();

  var headers = ["Serial Number", "Page Name", "Caption", "Media URL", "Media Type", "File Name", "Facebook ID", "Instagram ID", "Thumbnail", "Post to Facebook", "Post to Instagram"];
  targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  var rows = matchedMedia.map(function(media) {
    return [media.serial, media.pageName, "", media.url, media.type, media.name, media.facebookId, media.instagramId, thumbnailLink || "", false, false];
  });

  if (rows.length > 0) {
    targetSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    targetSheet.getRange(2, 10, rows.length, 2).insertCheckboxes();
  }

  targetSheet.hideColumns(7, 2);  // Hide Facebook ID and Instagram ID columns

  var endTime = new Date();
  var totalTime = (endTime - startTime) / 1000;
  Logger.log(`Total time taken: ${totalTime.toFixed(2)} seconds`);
  Logger.log(`Processed ${mediaFiles.length} files`);
}

function isPossibleThumbnail(fileName, keywords) {
  return keywords.some(keyword => fileName.includes(keyword));
}

function extractNumberFromFileName(fileName) {
  var match = fileName.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}