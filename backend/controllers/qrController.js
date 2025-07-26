const QRCode = require('qrcode');
const PlantLot = require('../models/PlantLot');
const path = require('path');
const fs = require('fs').promises;

// @desc    Generate QR code for a plant lot
// @route   GET /api/qr/lot/:lotId
// @access  Private
const generateLotQRCode = async (req, res) => {
  try {
    const { lotId } = req.params;
    const { format = 'base64', size = 200 } = req.query;

    // Verify that the lot exists
    const lot = await PlantLot.findOne({ lotId }).populate('speciesId', 'name code');
    
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Plant lot not found'
      });
    }

    // Create QR code data with lot information
    const qrData = {
      lotId: lot.lotId,
      speciesName: lot.speciesId.name,
      speciesCode: lot.speciesId.code,
      plantedDate: lot.plantedDate,
      zone: lot.zone,
      locationId: lot.locationId,
      url: `${req.protocol}://${req.get('host')}/api/lots/${lot._id}`
    };

    const qrCodeText = JSON.stringify(qrData);

    // QR code options
    const options = {
      width: parseInt(size),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    if (format === 'base64') {
      // Generate QR code as base64 data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrCodeText, options);
      
      res.status(200).json({
        success: true,
        data: {
          lotId: lot.lotId,
          qrCode: qrCodeDataURL,
          format: 'base64',
          size: parseInt(size),
          lotInfo: qrData
        }
      });
    } else if (format === 'png') {
      // Generate QR code as PNG buffer
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeText, options);
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="lot-${lotId}-qr.png"`,
        'Content-Length': qrCodeBuffer.length
      });
      
      res.send(qrCodeBuffer);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Use "base64" or "png"'
      });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating QR code'
    });
  }
};

// @desc    Generate QR codes for multiple lots
// @route   POST /api/qr/lots/batch
// @access  Private
const generateBatchQRCodes = async (req, res) => {
  try {
    const { lotIds, format = 'base64', size = 200 } = req.body;

    if (!lotIds || !Array.isArray(lotIds) || lotIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of lot IDs'
      });
    }

    if (lotIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 lot IDs allowed per batch'
      });
    }

    // Find all lots
    const lots = await PlantLot.find({ 
      lotId: { $in: lotIds } 
    }).populate('speciesId', 'name code');

    if (lots.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No lots found for the provided IDs'
      });
    }

    const qrCodes = [];
    const options = {
      width: parseInt(size),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    // Generate QR codes for each lot
    for (const lot of lots) {
      const qrData = {
        lotId: lot.lotId,
        speciesName: lot.speciesId.name,
        speciesCode: lot.speciesId.code,
        plantedDate: lot.plantedDate,
        zone: lot.zone,
        locationId: lot.locationId,
        url: `${req.protocol}://${req.get('host')}/api/lots/${lot._id}`
      };

      const qrCodeText = JSON.stringify(qrData);

      try {
        if (format === 'base64') {
          const qrCodeDataURL = await QRCode.toDataURL(qrCodeText, options);
          qrCodes.push({
            lotId: lot.lotId,
            qrCode: qrCodeDataURL,
            lotInfo: qrData
          });
        } else {
          const qrCodeBuffer = await QRCode.toBuffer(qrCodeText, options);
          qrCodes.push({
            lotId: lot.lotId,
            qrCode: qrCodeBuffer.toString('base64'),
            lotInfo: qrData
          });
        }
      } catch (qrError) {
        console.error(`Error generating QR for lot ${lot.lotId}:`, qrError);
        qrCodes.push({
          lotId: lot.lotId,
          error: 'Failed to generate QR code',
          lotInfo: qrData
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        qrCodes,
        format,
        size: parseInt(size),
        total: qrCodes.length,
        requested: lotIds.length
      }
    });
  } catch (error) {
    console.error('Error generating batch QR codes:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating batch QR codes'
    });
  }
};

// @desc    Generate QR code for lot information page
// @route   GET /api/qr/lot/:lotId/info
// @access  Private
const generateLotInfoQRCode = async (req, res) => {
  try {
    const { lotId } = req.params;
    const { format = 'base64', size = 200 } = req.query;

    // Verify that the lot exists
    const lot = await PlantLot.findOne({ lotId }).populate('speciesId', 'name code category');
    
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Plant lot not found'
      });
    }

    // Create a simple URL for lot information
    const lotInfoUrl = `${req.protocol}://${req.get('host')}/api/lots/${lot._id}`;

    // QR code options
    const options = {
      width: parseInt(size),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };

    if (format === 'base64') {
      // Generate QR code as base64 data URL
      const qrCodeDataURL = await QRCode.toDataURL(lotInfoUrl, options);
      
      res.status(200).json({
        success: true,
        data: {
          lotId: lot.lotId,
          qrCode: qrCodeDataURL,
          format: 'base64',
          size: parseInt(size),
          url: lotInfoUrl,
          lotInfo: {
            lotId: lot.lotId,
            speciesName: lot.speciesId.name,
            zone: lot.zone,
            plantedDate: lot.plantedDate
          }
        }
      });
    } else if (format === 'png') {
      // Generate QR code as PNG buffer
      const qrCodeBuffer = await QRCode.toBuffer(lotInfoUrl, options);
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="lot-${lotId}-info-qr.png"`,
        'Content-Length': qrCodeBuffer.length
      });
      
      res.send(qrCodeBuffer);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Use "base64" or "png"'
      });
    }
  } catch (error) {
    console.error('Error generating lot info QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating lot info QR code'
    });
  }
};

// @desc    Get QR code statistics
// @route   GET /api/qr/stats
// @access  Private
const getQRStats = async (req, res) => {
  try {
    const totalLots = await PlantLot.countDocuments();
    const lotsWithPhotos = await PlantLot.countDocuments({ 
      photos: { $exists: true, $ne: [] } 
    });

    res.status(200).json({
      success: true,
      data: {
        totalLots,
        lotsWithPhotos,
        qrCodesAvailable: totalLots,
        message: 'QR codes can be generated for all plant lots'
      }
    });
  } catch (error) {
    console.error('Error fetching QR stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching QR statistics'
    });
  }
};

module.exports = {
  generateLotQRCode,
  generateBatchQRCodes,
  generateLotInfoQRCode,
  getQRStats
};
