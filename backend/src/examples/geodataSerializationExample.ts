import { GeodataSerializationService } from '../services/GeodataSerializationService.minimal';

/**
 * Example demonstrating the GeodataSerializationService functionality
 * This shows how to use the service for coordinate transformation and GeoJSON handling
 */

// Example map configuration for Berlin area
const berlinMapConfig = {
  mapBounds: {
    north: 52.6755,
    south: 52.3382,
    east: 13.7611,
    west: 13.0883
  },
  canvasBounds: {
    width: 1200,
    height: 800
  }
};

console.log('=== GeodataSerializationService Example ===\n');

// 1. Coordinate Transformation Example
console.log('1. Coordinate Transformation:');
const canvasCenter = { x: 600, y: 400 }; // Center of canvas
const geoCenter = GeodataSerializationService.canvasToGeo(canvasCenter, berlinMapConfig);
console.log(`Canvas center (${canvasCenter.x}, ${canvasCenter.y}) -> Geographic (${geoCenter.lng.toFixed(4)}, ${geoCenter.lat.toFixed(4)})`);

const backToCanvas = GeodataSerializationService.geoToCanvas(geoCenter, berlinMapConfig);
console.log(`Back to canvas: (${backToCanvas.x.toFixed(1)}, ${backToCanvas.y.toFixed(1)})\n`);

// 2. GeoJSON Creation and Validation Example
console.log('2. GeoJSON Creation and Validation:');
const sampleGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [13.4050, 52.5200] // Brandenburg Gate
      },
      properties: {
        elementType: 'point',
        style: { color: '#ff0000', radius: 8 },
        metadata: { label: 'Brandenburg Gate', category: 'landmark' }
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [13.3770, 52.5080], // Tiergarten area
          [13.4200, 52.5080],
          [13.4200, 52.5320],
          [13.3770, 52.5320],
          [13.3770, 52.5080]
        ]]
      },
      properties: {
        elementType: 'polygon',
        style: { fillColor: '#00ff00', fillOpacity: 0.3 },
        metadata: { label: 'Tiergarten', category: 'park' }
      }
    }
  ]
};

const validation = GeodataSerializationService.validateGeoJSON(sampleGeoJSON);
console.log(`GeoJSON validation: ${validation.isValid ? 'VALID' : 'INVALID'}`);
if (validation.errors.length > 0) {
  console.log('Errors:', validation.errors);
}
if (validation.warnings && validation.warnings.length > 0) {
  console.log('Warnings:', validation.warnings);
}

// 3. Convert GeoJSON to Drawing Elements
console.log('\n3. Converting GeoJSON to Drawing Elements:');
const drawingElements = GeodataSerializationService.geoJSONToElements(sampleGeoJSON, 'berlin-map-drawing');
console.log(`Created ${drawingElements.length} drawing elements:`);
drawingElements.forEach((element, index) => {
  console.log(`  ${index + 1}. Type: ${element.elementType}, Style: ${JSON.stringify(element.styleProperties)}`);
});

// 4. Fabric.js Integration Example
console.log('\n4. Fabric.js Canvas Integration:');
const fabricObjects = [
  {
    type: 'circle',
    left: 580, // Near Brandenburg Gate on canvas
    top: 380,
    radius: 20,
    fill: '#ff6b6b',
    stroke: '#c92a2a',
    strokeWidth: 2,
    id: 'poi-1',
    metadata: { name: 'Important Location' }
  },
  {
    type: 'line',
    x1: 300,
    y1: 200,
    x2: 900,
    y2: 600,
    stroke: '#339af0',
    strokeWidth: 4,
    id: 'route-1',
    metadata: { name: 'Main Route' }
  },
  {
    type: 'polygon',
    left: 200,
    top: 150,
    points: [
      { x: 0, y: 0 },
      { x: 150, y: 0 },
      { x: 150, y: 100 },
      { x: 0, y: 100 }
    ],
    fill: '#51cf66',
    opacity: 0.7,
    id: 'area-1',
    metadata: { name: 'Study Area' }
  }
];

const fabricGeoJSON = GeodataSerializationService.fabricObjectsToGeoJSON(fabricObjects, berlinMapConfig);
console.log(`Converted ${fabricObjects.length} Fabric.js objects to GeoJSON with ${fabricGeoJSON.features.length} features`);

fabricGeoJSON.features.forEach((feature, index) => {
  const coords = feature.geometry.type === 'Point' 
    ? (feature.geometry as GeoJSON.Point).coordinates
    : 'Complex geometry';
  console.log(`  ${index + 1}. ${feature.geometry.type} at ${Array.isArray(coords) ? `(${coords[0].toFixed(4)}, ${coords[1].toFixed(4)})` : coords}`);
});

// 5. Error Handling Example
console.log('\n5. Error Handling:');
const invalidGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: ['invalid', 'coordinates']
      },
      properties: {}
    }
  ]
};

const invalidValidation = GeodataSerializationService.validateGeoJSON(invalidGeoJSON);
console.log(`Invalid GeoJSON validation: ${invalidValidation.isValid ? 'VALID' : 'INVALID'}`);
console.log('Errors found:', invalidValidation.errors);

console.log('\n=== Example Complete ===');

export { berlinMapConfig, sampleGeoJSON, fabricObjects };