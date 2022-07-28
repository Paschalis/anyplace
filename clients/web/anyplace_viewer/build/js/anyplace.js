/**
 *
 The MIT License (MIT)

 Copyright (c) 2015, Kyriakos Georgiou, Data Management Systems Laboratory (DMSL)
 Department of Computer Science, University of Cyprus, Nicosia, CYPRUS,
 dmsl@cs.ucy.ac.cy, http://dmsl.cs.ucy.ac.cy/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

var app = angular.module('anyViewer', ['ngRoute', 'ui.bootstrap', 'ui.select', 'ngSanitize','angular-loading-bar']);

app.service('GMapService', function () {

    this.gmap = {};
    this.directionsDisplay = undefined;
    this.directionsService = undefined;
//    this.searchBox = {};

    var self = this;

    var element = document.getElementById("map-canvas");

    /**
     * @constructor
     * @implements {google.maps.MapType}
     */
    function CoordMapType(tileSize) {
        this.tileSize = tileSize;
    }

    CoordMapType.prototype.maxZoom = 22;
    CoordMapType.prototype.name = 'Tile #s';
    CoordMapType.prototype.alt = 'Tile Coordinate Map Type';

    CoordMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
        var div = ownerDocument.createElement('div');
        div.innerHTML = coord;
        div.style.width = this.tileSize.width + 'px';
        div.style.height = this.tileSize.height + 'px';
        div.style.fontSize = '10';
        div.style.borderStyle = 'solid';
        div.style.borderWidth = '1px';
        div.style.borderColor = '#AAAAAA';
        div.style.backgroundColor = '#E5E3DF';
        return div;
    };

    /**
     * @constructor
     * @implements {google.maps.MapType}
     */
    function OSMMapType(tileSize) {
        this.tileSize = tileSize;
    }

    OSMMapType.prototype.maxZoom = 22;
    OSMMapType.prototype.name = 'OSM';
    OSMMapType.prototype.alt = 'Tile OSM Map Type';
    OSMMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
        // CHECK:PM no tiles for lower level
        if (zoom>19) return null;
        var tilesPerGlobe = 1 << zoom;
        var x = coord.x % tilesPerGlobe;
        if (x < 0) {
            x = tilesPerGlobe+x;
        }
        var tile = ownerDocument.createElement('img');
        // Wrap y (latitude) in a like manner if you want to enable vertical infinite scroll
        tile.src =  "https://tile.openstreetmap.org/" + zoom + "/" + x + "/" + coord.y + ".png";
        tile.style.width = this.tileSize.width + 'px';
        tile.style.height = this.tileSize.height + 'px';
        return tile;
    };

    /**
     * @constructor
     * @implements {google.maps.MapType}
     */
    function CartoLightMapType(tileSize) {
        this.tileSize = tileSize;
    }

    CartoLightMapType.prototype.maxZoom = 22;
    CartoLightMapType.prototype.name = 'Carto Light';
    CartoLightMapType.prototype.alt = 'Tile Carto Light Map Type';
    CartoLightMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
        var url="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png";
        url=url.replace('{x}', coord.x)
            .replace('{y}', coord.y)
            .replace('{z}', zoom);
        var tile = ownerDocument.createElement('img');
        // Wrap y (latitude) in a like manner if you want to enable vertical infinite scroll
        tile.src = url;
        tile.style.width = this.tileSize.width + 'px';
        tile.style.height = this.tileSize.height + 'px';
        return tile;
    };

    /**
     * @constructor
     * @implements {google.maps.MapType}
     */
    function CartoDarkMapType(tileSize) {
        this.tileSize = tileSize;
    }

    CartoDarkMapType.prototype.maxZoom = 22;
    CartoDarkMapType.prototype.name = 'Carto Dark';
    CartoDarkMapType.prototype.alt = 'Tile Carto Dark Map Type';
    CartoDarkMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
      var url="https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png";

        url=url.replace('{x}', coord.x)
            .replace('{y}', coord.y)
            .replace('{z}', zoom);
        var tile = ownerDocument.createElement('img');
        // Wrap y (latitude) in a like manner if you want to enable vertical infinite scroll
        tile.src = url;
        tile.style.width = this.tileSize.width + 'px';
        tile.style.height = this.tileSize.height + 'px';
        return tile;
    };

    var mapTypeId = DEFAULT_MAP_TILES;
    if (typeof(Storage) !== "undefined" && localStorage) {
        localStorage.setItem("mapTypeId", DEFAULT_MAP_TILES);// FORCE OSM
        // if (localStorage.getItem('mapTypeId')) mapTypeId = localStorage.getItem('mapTypeId');
        // else localStorage.setItem("mapTypeId", DEFAULT_MAP_TILES);
    }

    self.gmap = new google.maps.Map(element, {
        center: new google.maps.LatLng(57, 21),
        zoomControl: true,
        fullscreenControl: false,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.LEFT_CENTER
        },
        scaleControl: true,
        streetViewControl: false,
        overviewMapControl: true,
        zoom: 3,
        mapTypeId: mapTypeId,
        mapTypeControlOptions: {
            mapTypeIds: ['OSM', /* 'CartoDark',*/ 'CartoLight', /* 'coordinate',*/ 'roadmap', 'satellite'],
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.LEFT_CENTER
        }
    });

    // WORKAROUNDS:
    google.maps.event.addListener(self.gmap, 'tilesloaded', function(){
        // Once map object is rendered, hide gmaps warning (billing account)
        // We are migrating to leaflet for this.
        $(".dismissButton").click();
    });

  self.gmap.addListener('maptypeid_changed', function () {
    // BUGFIX: Loading of maps fail when zoomed to MAX level with fingerprints enabled.
    //Issue happens due to setting of custom maptype Id
    if (self.gmap.getMapTypeId() === 'my_custom_layer1' && self.gmap.zoom < 22) {
      self.gmap.setMapTypeId(localStorage.getItem("previousMapTypeId"));
    } 
    else if (self.gmap.getMapTypeId() !== 'my_custom_layer1' && self.gmap.zoom === 22){
      localStorage.setItem("previousMapTypeId",self.gmap.getMapTypeId());
    }

    var showStreetViewControl = self.gmap.getMapTypeId() === 'roadmap' || self.gmap.getMapTypeId() === 'satellite';
    localStorage.setItem("mapTypeId",self.gmap.getMapTypeId());
    customMapAttribution(self.gmap);
    self.gmap.setOptions({
      streetViewControl: showStreetViewControl
    });
  });

    function customMapAttribution(map) {
        var id = "custom-maps-attribution";
        var attributionElm = document.getElementById(id);
        if (attributionElm === undefined || attributionElm === null) {
            attributionElm = document.createElement('div');
            attributionElm.id = id;
            map.controls[google.maps.ControlPosition.BOTTOM_RIGHT].push(attributionElm);
        }
        if (self.gmap.getMapTypeId() === "OSM")
            attributionElm.innerHTML = '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        if (self.gmap.getMapTypeId() === "roadmap")
            attributionElm.innerHTML = '';
        if (self.gmap.getMapTypeId() === "satellite")
            attributionElm.innerHTML = '';
        if (self.gmap.getMapTypeId() === "CartoLight")
            attributionElm.innerHTML = '<a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attribution">CARTO</a>';
    }

    //Define OSM map type pointing at the OpenStreetMap tile server
    self.gmap.mapTypes.set("OSM", new OSMMapType(new google.maps.Size(256, 256)));
    //Define Carto Dark map type pointing at the OpenStreetMap tile server
    // self.gmap.mapTypes.set("CartoDark", new CartoDarkMapType(new google.maps.Size(256, 256)));
    //Define Carto Light map type pointing at the OpenStreetMap tile server
    self.gmap.mapTypes.set("CartoLight", new CartoLightMapType(new google.maps.Size(256, 256)));
    // Now attach the coordinate map type to the map's registry.
    //self.gmap.mapTypes.set('coordinate', new CoordMapType(new google.maps.Size(256, 256)));
    customMapAttribution(self.gmap);

    var directionsService = new google.maps.DirectionsService();
    var directionsDisplay = new google.maps.DirectionsRenderer();

    self.calcRoute = function (start, end, callback) {

        if (self.gmap.getMapTypeId()!== 'roadmap' && self.gmap.getMapTypeId()!== 'satellite'){
            console.log("Google API deprecated.");
            return;
        }

        if (!start || !end) {
            console.log("Invalid start or end point.");
            return;
        }

        var request = {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setMap(self.gmap);
                directionsDisplay.setDirections(response);
                if (response && response.routes && response.routes.length && response.routes[0].overview_path && response.routes[0].overview_path.length) {
                    var len = response.routes[0].overview_path.length;
                    callback(response.routes[0].overview_path[len - 1]);
                } else {
                    callback(undefined);
                }
            } else {
                callback(undefined);
            }
        });
    };

    self.clearRoute = function () {
        if (directionsDisplay)
            directionsDisplay.setMap(null);
    };

    self.isRouteShown = function () {
        return directionsDisplay && directionsDisplay.getMap();
    };

    // Initialize search box for places
//    var input = (document.getElementById('pac-input'));
//    self.gmap.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
//    self.searchBox = new google.maps.places.SearchBox((input));
//
//    google.maps.event.addListener(self.searchBox, 'places_changed', function () {
//        var places = self.searchBox.getPlaces();
//
//        if (places.length == 0) {
//            return;
//        }
//
//        self.gmap.panTo(places[0].geometry.location);
//        self.gmap.setZoom(17);
//    });

    // Bias the SearchBox results towards places that are within the bounds of the
    // current map's viewport.
//    self.gmap.addListener(self.gmap, 'bounds_changed', function () {
//        var bounds = self.gmap.getBounds();
//        searchBox.setBounds(bounds);
//    });

    // Add click listener on map to add a marker on click
    //google.maps.event.addListener(self.gmap, 'click', function (event) {
    //
    //    if (!self.mainMarker) {
    //        self.mainMarker = new google.maps.Marker({
    //            position: event.latLng,
    //            map: self.gmap,
    //            title: "Helper marker at (" + event.latLng.lat() + ", " + event.latLng.lng() + ")"
    //        });
    //    }
    //
    //    self.mainMarker.setPosition(event.latLng);
    //    self.mainMarker.setTitle("Helper marker at (" + event.latLng.lat() + ", " + event.latLng.lng() + ")");
    //});

});

app.factory('AnyplaceService', ['$rootScope', '$q', function ($rootScope, $q) {

    var anyService = {};
    anyService.BuildingsLoaded = true;
    anyService.selectedBuilding = undefined;
    anyService.selectedFloor = undefined;
    anyService.selectedPoi = undefined;
    anyService.selectedGenPoi = undefined;
    anyService.selectedSearchPoi = undefined;
    anyService.myBuildingSelected = undefined;
    anyService.selectedCampus = undefined;

    anyService.availableFloors = {};

    anyService.jsonReq = {
        username: 'username',
        password: 'password'
    };

    // notifications
    anyService.alerts = [];

    anyService.getBuilding = function () {
        return this.selectedBuilding;
    };

    anyService.getBuildingId = function () {
        if (!this.selectedBuilding) {
            return undefined;
        }
        return this.selectedBuilding.buid;
    };

    anyService.getBuildingName = function () {
        if (!this.selectedBuilding) {
            return 'N/A';
        }
        return this.selectedBuilding.name;
    };

    anyService.getFloor = function () {
        return this.selectedFloor;
    };

    anyService.getFloorNumber = function () {
        if (!this.selectedFloor) {
            return 'N/A';
        }
        return String(this.selectedFloor.floor_number);
    };

    anyService.setBuilding = function (b) {
        this.selectedBuilding = b;
    };

    anyService.setFloor = function (f) {
        this.selectedFloor = f;
    };

    anyService.setSelectedFloorByNum = function (fnum) {
        this.selectedFloor = anyService.availableFloors[fnum];
    };

    anyService.addAlert = function (type, msg) {
        this.alerts[0] = ({msg: msg, type: type});
    };

    anyService.closeAlert = function (index) {
        this.alerts.splice(index, 1);
    };

    anyService.getBuildingViewerUrl = function () {
        if (!this.selectedBuilding || !this.selectedBuilding.buid) {
            return "N/A";
        }
        return "https://anyplace.cs.ucy.ac.cy/viewer/?buid=" + this.selectedBuilding.buid;
    };

    anyService.getViewerUrl = function () {
        var baseUrl="";
        if (!this.selectedBuilding || !this.selectedBuilding.buid)
            return baseUrl;
        baseUrl += "buid=" + this.selectedBuilding.buid;

        if (!this.selectedFloor || !this.selectedFloor.floor_number)
            return baseUrl;
        baseUrl += "&floor=" + this.selectedFloor.floor_number;

        if (!this.selectedPoi || !this.selectedPoi.puid)
            return baseUrl;
        baseUrl += "&selected=" + this.selectedPoi.puid;
        return baseUrl;
    };

    anyService.clearAllData = function () {
        anyService.selectedPoi = undefined;
        anyService.selectedFloor = undefined;
        anyService.selectedBuilding = undefined;
        anyService.selectedGenPoi = undefined;
    };

    return anyService;
}]);

app.factory('Alerter', function () {
    var alerter = {};

    alerter.AlertCtrl = '-';

    return alerter;
});

app.factory('formDataObject', function () {
    return function (data, headersGetter) {
        var formData = new FormData();
        angular.forEach(data, function (value, key) {
            formData.append(key, value);
        });

        var headers = headersGetter();
        delete headers['Content-Type'];
        return formData;
    };
});

app.config(['$locationProvider', function ($location) {
    //now there won't be a hashbang within URLs for browsers that support HTML5 history
    $location.html5Mode({
        enabled: true,
        requireBase: false
    });
}]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/#/b/:alias', {
            templateUrl: 'index.html',
            controller: 'ControlBarController',
            caseInsensitiveMatch: true
        })
        .otherwise({redirectTo: '/', caseInsensitiveMatch: true});
}]);

app.config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
}]);

app.filter('propsFilter', function () {
    return function (items, props) {
        var out = [];

        if (angular.isArray(items)) {
            items.forEach(function (item) {
                var itemMatches = false;

                var keys = Object.keys(props);
                for (var i = 0; i < keys.length; i++) {
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }

                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            // Let the output be the input untouched
            out = items;
        }

        return out;
    }
});

/**
 *
 The MIT License (MIT)

 Copyright (c) 2015, Kyriakos Georgiou, Data Management Systems Laboratory (DMSL)
 Department of Computer Science, University of Cyprus, Nicosia, CYPRUS,
 dmsl@cs.ucy.ac.cy, http://dmsl.cs.ucy.ac.cy/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

// TODO:NN once all done, and commited. rename ONLY this to API
var API = {};
API.old = "../anyplace";
API.url = "../api"

API.VERSION = API.url + "/version";

/**
 * MAPPING API
 */
API.Mapping = {};
API.Navigation = {};
API.Other = {};

API.Mapping.APs = "/wifi/access_points/floor";
API.Mapping.APs_URL = API.url + API.Mapping.APs;
API.Mapping.GET_APS_IDS = "/wifi/access_points/ids";
API.Mapping.GET_APS_IDS_URL = API.url + API.Mapping.GET_APS_IDS;

API.Mapping.FINGERPRINTS_DELETE = "/auth/radiomap/delete";
API.Mapping.FINGERPRINTS_DELETE_URL = API.url + API.Mapping.FINGERPRINTS_DELETE;
API.Mapping.FINGERPRINTS_DELETE_TIME = "/auth/radiomap/delete/time";
API.Mapping.FINGERPRINTS_DELETE_TIME_URL = API.url + API.Mapping.FINGERPRINTS_DELETE_TIME;
API.Mapping.FINGERPRINTS_TIME = "/radiomap/time";
API.Mapping.FINGERPRINTS_TIME_URL = API.url + API.Mapping.FINGERPRINTS_TIME;

API.Mapping.RADIO_HEATMAP_RSS_1 = "/heatmap/floor/average/1";
API.Mapping.RADIO_HEATMAP_RSS_URL_1 = API.url + API.Mapping.RADIO_HEATMAP_RSS_1;
API.Mapping.RADIO_HEATMAP_RSS_2 = "/heatmap/floor/average/2";
API.Mapping.RADIO_HEATMAP_RSS_URL_2 = API.url + API.Mapping.RADIO_HEATMAP_RSS_2;
API.Mapping.RADIO_HEATMAP_RSS_3 = "/heatmap/floor/average/3";
API.Mapping.RADIO_HEATMAP_RSS_URL_3 = API.url + API.Mapping.RADIO_HEATMAP_RSS_3;
API.Mapping.RADIO_HEATMAP_RSS_3_TILES = "/heatmap/floor/average/3/tiles";
API.Mapping.RADIO_HEATMAP_RSS_URL_3_TILES = API.url + API.Mapping.RADIO_HEATMAP_RSS_3_TILES;

API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_1 = "/heatmap/floor/average/timestamp/1";
API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_URL_1 = API.url + API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_1;
API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_2 = "/heatmap/floor/average/timestamp/2";
API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_URL_2 = API.url + API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_2;
API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_3 = "/heatmap/floor/average/timestamp/3";
API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_URL_3 = API.url + API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_3;
API.Mapping.RADIO_HEATMAP_BY_TIME_TILES = "/heatmap/floor/average/timestamp/tiles";
API.Mapping.RADIO_HEATMAP_BY_TIME_TILES_URL = API.url + API.Mapping.RADIO_HEATMAP_BY_TIME_TILES;

API.Mapping.RADIOMAP_DELETE = "/position/radio/heatmap_building_floor_delete";
API.Mapping.RADIOMAP_DELETE_URL = API.old + API.Mapping.RADIOMAP_DELETE;
// AnyplaceAPI.Mapping.RADIO_HEATMAP_RSS_ACCES = "/position/radio/acces";
// AnyplaceAPI.Mapping.RADIO_HEATMAP_RSS_ACCES_URL = AnyplaceAPI.BASE_URL + AnyplaceAPI.Mapping.RADIO_HEATMAP_RSS_ACCES;
API.Mapping.RADIO_HEATMAP_POI = "/mapping/radio/radio_heatmap_bbox";
API.Mapping.RADIO_HEATMAP_URL_POI = API.old + API.Mapping.RADIO_HEATMAP_POI;

API.Mapping.RADIO_BY_BUILDING_FLOOR_ALL = "/radiomap/floor/all";
API.Mapping.RADIO_BY_BUILDING_FLOOR_ALL_URL = API.url + API.Mapping.RADIO_BY_BUILDING_FLOOR_ALL;
API.Mapping.RADIO_BY_BUILDING_FLOOR_ALL_TXT = "/position/radio_by_building_floor_all_text";
API.Mapping.RADIO_BY_BUILDING_FLOOR_ALL_TXT_URL = API.old + API.Mapping.RADIO_BY_BUILDING_FLOOR_ALL_TXT;

// TODO:NN replace BUILDING to SPACE everywhere here..
API.Mapping.BUILDING_ADD = "/auth/mapping/space/add";
API.Mapping.BUILDING_ADD_URL = API.url + API.Mapping.BUILDING_ADD;
API.Mapping.BUILDING_ONE = "/mapping/space/get";
API.Mapping.BUILDING_ONE_URL = API.url + API.Mapping.BUILDING_ONE;
API.Mapping.BUILDING_UPDATE = "/auth/mapping/space/update";
API.Mapping.BUILDING_UPDATE_URL = API.url + API.Mapping.BUILDING_UPDATE;
API.Mapping.BUILDING_DELETE = "/auth/mapping/space/delete";
API.Mapping.BUILDING_DELETE_URL = API.url + API.Mapping.BUILDING_DELETE;
API.Mapping.BUILDING_ALL = "/mapping/space/public";
API.Mapping.BUILDING_ALL_URL = API.url + API.Mapping.BUILDING_ALL;
API.Mapping.BUILDING_ALL_OWNER = "/auth/mapping/space/accessible";
API.Mapping.BUILDING_ALL_OWNER_URL = API.url + API.Mapping.BUILDING_ALL_OWNER;

API.Mapping.CAMPUS_ALL = "/auth/mapping/campus/user";
API.Mapping.CAMPUS_ALL_URL = API.url + API.Mapping.CAMPUS_ALL;
API.Mapping.CAMPUS_UPDATE = "/auth/mapping/campus/update";
API.Mapping.CAMPUS_UPDATE_URL = API.url + API.Mapping.CAMPUS_UPDATE;
API.Mapping.CAMPUS_DELETE = "/auth/mapping/campus/delete";
API.Mapping.CAMPUS_DELETE_URL = API.url + API.Mapping.CAMPUS_DELETE;
API.Mapping.BUILDINGSET_ADD = "/auth/mapping/campus/add";
API.Mapping.BUILDINGSET_ADD_URL = API.url + API.Mapping.BUILDINGSET_ADD;
API.Mapping.BUILDINGSET_ALL = "/mapping/campus/get";
API.Mapping.BUILDINGSET_ALL_URL = API.url + API.Mapping.BUILDINGSET_ALL;

API.Mapping.FLOOR_ADD = "/auth/mapping/floor/add";
API.Mapping.FLOOR_ADD_URL = API.url + API.Mapping.FLOOR_ADD;
API.Mapping.FLOOR_UPDATE = "/auth/mapping/floor/update";
API.Mapping.FLOOR_UPDATE_URL = API.url + API.Mapping.FLOOR_UPDATE;
API.Mapping.FLOOR_DELETE = "/auth/mapping/floor/delete";
API.Mapping.FLOOR_DELETE_URL = API.url + API.Mapping.FLOOR_DELETE;
API.Mapping.FLOOR_ALL = "/mapping/floor/all";
API.Mapping.FLOOR_ALL_URL = API.url + API.Mapping.FLOOR_ALL;
API.Mapping.FLOOR_PLAN_UPLOAD = "/mapping/floor/floorplan/upload";
API.Mapping.FLOOR_PLAN_UPLOAD_URL = API.url + API.Mapping.FLOOR_PLAN_UPLOAD;
API.Mapping.FLOOR_PLAN_DOWNLOAD = "/floorplans64/";
API.Mapping.FLOOR_PLAN_DOWNLOAD_URL = API.url + API.Mapping.FLOOR_PLAN_DOWNLOAD;
API.Mapping.FLOOR_PLAN_DOWNLOAD_ALL = "/floorplans64/all/";
API.Mapping.FLOOR_PLAN_DOWNLOAD_URL_ALL = API.url + API.Mapping.FLOOR_PLAN_DOWNLOAD_ALL;

API.Mapping.POIS_ADD = "/auth/mapping/pois/add";
API.Mapping.POIS_ADD_URL = API.url + API.Mapping.POIS_ADD;
API.Mapping.POIS_UPDATE = "/auth/mapping/pois/update";
API.Mapping.POIS_UPDATE_URL = API.url + API.Mapping.POIS_UPDATE;
API.Mapping.POIS_DELETE = "/auth/mapping/pois/delete";
API.Mapping.POIS_DELETE_URL = API.url + API.Mapping.POIS_DELETE;
API.Mapping.POIS_ALL_FLOOR = "/mapping/pois/floor/all";
API.Mapping.POIS_ALL_FLOOR_URL = API.url + API.Mapping.POIS_ALL_FLOOR;
API.Mapping.POIS_ALL_BUILDING = "/mapping/pois/space/all";
API.Mapping.POIS_ALL_BUILDING_URL = API.url + API.Mapping.POIS_ALL_BUILDING;
API.Mapping.ALL_POIS = "/mapping/pois/search";
API.Mapping.ALL_POIS_URL = API.url + API.Mapping.ALL_POIS;

API.Mapping.CONNECTION_ADD = "/auth/mapping/connection/add";
API.Mapping.CONNECTION_ADD_URL = API.url + API.Mapping.CONNECTION_ADD;
API.Mapping.CONNECTION_UPDATE = "/auth/mapping/connection/update";
API.Mapping.CONNECTION_UPDATE_URL = API.old + API.Mapping.CONNECTION_UPDATE;
API.Mapping.CONNECTION_DELETE = "/mapping/connection/delete";
API.Mapping.CONNECTION_DELETE_URL = API.url + API.Mapping.CONNECTION_DELETE;
API.Mapping.CONNECTION_ALL_FLOOR = "/mapping/connection/floor/all";
API.Mapping.CONNECTION_ALL_FLOOR_URL = API.url + API.Mapping.CONNECTION_ALL_FLOOR;

API.Mapping.LOGIN_GOOGLE = "/user/login/google";
API.Mapping.LOGIN_GOOGLE_URL = API.url + API.Mapping.LOGIN_GOOGLE;

API.Mapping.LOGIN_LOCAL = "/user/login";
API.Mapping.LOGIN_LOCAL_URL = API.url + API.Mapping.LOGIN_LOCAL;

API.Mapping.LOGIN_REFRESH_LOCAL = "/user/refresh";
API.Mapping.LOGIN_REFRESH_LOCAL_URL = API.url + API.Mapping.LOGIN_REFRESH_LOCAL;

API.Mapping.REGISTER_LOCAL = "/user/register";
API.Mapping.REGISTER_LOCAL_URL = API.url + "/user/register";

API.Navigation.POIS_ROUTE = "/navigation/route";
API.Navigation.POIS_ROUTE = API.url + API.Navigation.POIS_ROUTE;

API.Other.GOOGLE_URL_SHORTNER_URL = "https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDLSYNnIC93KfPnMYRL-7xI7yXjOhgulk8";

if (app == undefined) { LOG.F("api.js must be loaded after app.js in GruntFile)") }

app.factory('AnyplaceAPIService', ['$http', '$q', 'formDataObject', function ($http, $q, formDataObject) {

    $http.defaults.useXDomain = true;
    delete $http.defaults.headers.common['X-Requested-With'];

    var apiService = {};

    apiService.version = function (json_req) {
        return $http({
            method: "GET",
            url: API.VERSION,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getRadioHeatmapRSS_1 = function (json_req) {
        LOG.D2("getRadioHeatmapRSS_1");
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_HEATMAP_RSS_URL_1,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getRadioHeatmapRSS_2 = function (json_req) {
        LOG.D2("getRadioHeatmapRSS_2");
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_HEATMAP_RSS_URL_2,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getRadioHeatmapRSS_3 = function (json_req) {
        LOG.D2("getRadioHeatmapRSS_3");
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_HEATMAP_RSS_URL_3,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getRadioHeatmapRSS_3_Tiles = function (json_req) {
        LOG.D2("getRadioHeatmapRSS_3_Tiles");
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_HEATMAP_RSS_URL_3_TILES,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };


    apiService.getRadioHeatmapRSSByTime_1 = function (json_req) {
        LOG.D2("getRadioHeatmapRSSByTime_1");
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_URL_1,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getRadioHeatmapRSSByTime_2 = function (json_req) {
        LOG.D2("getRadioHeatmapRSSByTime_2");
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_URL_2,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getRadioHeatmapRSSByTime_3 = function (json_req) {
        LOG.D2("getRadioHeatmapRSSByTime_3");
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_HEATMAP_RSS_BY_TIME_URL_3,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getRadioHeatmapRSSByTime_Tiles = function (json_req) {
        LOG.D2("getRadioHeatmapRSSByTime_Tiles");
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_HEATMAP_BY_TIME_TILES_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };


    apiService.getAPs = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.APs_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };


    apiService.getAPsIds = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.GET_APS_IDS_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };


    apiService.deleteFingerprints = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.FINGERPRINTS_DELETE_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    apiService.deleteFingerprintsByTime = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.FINGERPRINTS_DELETE_TIME_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getFingerprintsTime = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.FINGERPRINTS_TIME_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    apiService.getHeatmapAcces = function (json_req) {
        return null;
        // DEPRECATED
        // return $http({
        //     method: "POST",
        //     url: AnyplaceAPI.Mapping.RADIO_HEATMAP_RSS_ACCES_URL,
        //     data: json_req
        // }).success(function (data, status) {
        //     return data;
        // }).error(function (data, status) {
        //     return data;
        // });

    };

    apiService.retrievePoisByBuilding = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.POIS_ALL_BUILDING_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getRadioHeatmapPoi = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_HEATMAP_URL_POI,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getRadioByBuildingFloorAll = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_BY_BUILDING_FLOOR_ALL_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getRadioByBuildingFloorTxt = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.RADIO_BY_BUILDING_FLOOR_ALL_TXT_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    /**************************************************
     * BUILDING FUNCTIONS
     */
    apiService.addBuilding = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.BUILDING_ADD_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.addBuildingSet = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.BUILDINGSET_ADD_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.updateBuilding = function (jsonReq) {
        return $http({
            method: "POST",
            url: API.Mapping.BUILDING_UPDATE_URL,
            data: jsonReq
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    apiService.updateCampus = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.CAMPUS_UPDATE_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    apiService.deleteBuilding = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.BUILDING_DELETE_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    // lsolea01
    apiService.deleteRadiomaps = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.RADIOMAP_DELETE_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    apiService.deleteCampus = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.CAMPUS_DELETE_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    apiService.allBuildings = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.BUILDING_ALL_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    apiService.allOwnerBuildings = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.BUILDING_ALL_OWNER_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    apiService.allCucodeCampus = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.BUILDINGSET_ALL_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    apiService.allCampus = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.CAMPUS_ALL_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };


    /****************************************************
     * FLOOR FUNCTIONS
     */

    apiService.addFloor = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.FLOOR_ADD_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.deleteFloor = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.FLOOR_DELETE_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };

    apiService.allBuildingFloors = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.FLOOR_ALL_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };


    apiService.uploadFloorPlan = function (json_req, file) {
        return $http({
            method: "POST",
            url: API.Mapping.FLOOR_PLAN_UPLOAD_URL,
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            data: {
                floorplan: file,
                json: json_req
            },
            transformRequest: formDataObject
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.uploadFloorPlan64 = function (json_req, file) {
        var fl_data = file.replace('data:image/png;base64,', '');
        var uarray = LPUtils.Base64Binary.decode(fl_data);
        var blob = new Blob([uarray]);
        fl_data = "";
        for (var i = 0; i < uarray.length; i++) {
            fl_data += uarray[i];
        }

        var formData = new FormData();
        formData.append("json", json_req);
        formData.append("floorplan", blob);
        return $http.post(API.Mapping.FLOOR_PLAN_UPLOAD_URL, formData, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.downloadFloorPlan = function (json_req, buid, floor_number) {
        return $http({
            method: "POST",
            url: API.Mapping.FLOOR_PLAN_DOWNLOAD_URL + buid + "/" + floor_number,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.downloadFloorPlanAll = function (json_req, buid, floor_number) {
        return $http({
            method: "POST",
            url: API.Mapping.FLOOR_PLAN_DOWNLOAD_URL_ALL + buid + "/" + floor_number,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };


    /******************************************************
     * POIS FUNCTIONS
     */
    apiService.addPois = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.POIS_ADD_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.updatePois = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.POIS_UPDATE_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.deletePois = function (json_req) {
        //var deferred = $q.defer(); // thiz can be used instead of returning the $http

        return $http({
            method: "POST",
            url: API.Mapping.POIS_DELETE_URL,
            data: json_req
        }).success(function (data, status) {
            //deferred.resolve(data);
            return data;
        }).error(function (data, status) {
            //deferred.resolve(data);
            return data;
        });
        //return deferred.promise;
    };

    apiService.retrievePoisByBuildingFloor = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.POIS_ALL_FLOOR_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    }


    /****************************************************
     * CONNECTION FUNCTIONS
     */
    apiService.addConnection = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.CONNECTION_ADD_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.deleteConnection = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.CONNECTION_DELETE_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.retrieveConnectionsByBuildingFloor = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.CONNECTION_ALL_FLOOR_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.loginGoogle = function (json_req) {
        LOG.D4("loginGoogle")
        LOG.D4(json_req)
        return $http({
            method: "POST",
            url: API.Mapping.LOGIN_GOOGLE_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.refreshLocalAccount = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.LOGIN_REFRESH_LOCAL_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.loginLocalAccount = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.LOGIN_LOCAL_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.registerLocalAccount = function (json_req) {
        LOG.D2("api.js");
        return $http({
            method: "POST",
            url: API.Mapping.REGISTER_LOCAL_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.getOneBuilding = function (json_req) {
        return $http({
            method: "POST",
            url: API.Mapping.BUILDING_ONE_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

    };


    apiService.retrieveALLPois = function (json_req) {
        var a = $http({
            method: "POST",
            url: API.Mapping.ALL_POIS_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });

        return a;
    }

    apiService.retrieveRouteFromPoiToPoi = function (json_req) {
        return $http({
            method: "POST",
            url: API.Navigation.POIS_ROUTE,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    apiService.googleUrlShortener = function (json_req) {
        return $http({
            method: "POST",
            url: API.Other.GOOGLE_URL_SHORTNER_URL,
            data: json_req
        }).success(function (data, status) {
            return data;
        }).error(function (data, status) {
            return data;
        });
    };

    // we return apiService controller in order to be able to use it in ng-click
    return apiService;
}]);

var MIN_ZOOM_FOR_HEATMAPS = 19;
var MAX_ZOOM_FOR_HEATMAPS = 21;
var _MAX_ZOOM_LEVEL = 22;
// var DEFAULT_MAP_TILES = "OSM";
var DEFAULT_MAP_TILES = "CartoLight";

// MESSAGES
//// Error messages
ERR_FETCH_BUILDINGS="Something went wrong while fetching buildings.";
ERR_FETCH_ALL_FLOORS="Something went wrong while fetching all floors.";
ERR_USER_AUTH="Could not authorize user. Please refresh.";
ERR_FETCH_FINGERPRINTS="Something went wrong while fetching fingerprints.";
ERR_GEOLOC_DEVICE_SETTINGS="Please enable location access.";
ERR_GEOLOC_NET_OR_SATELLITES="Position unavailable. The network is down or the positioning satellites couldn't be contacted.";
ERR_GEOLOC_TIMEOUT="Timeout. The request for retrieving your Geolocation was timed out.";
ERR_GEOLOC_UNKNOWN="There was an error while retrieving your Geolocation. Please try again.";
ERR_GEOLOC_NOT_SUPPORTED="The Geolocation feature is not supported by this browser.";

WARN_NO_FINGERPRINTS="This floor seems not to be FingerPrint mapped. Download the Anyplace app from the Google Play store to map the floor.";
WARN_ACCES_REMOVED="ACCES map removed.";
// COLLECTIONS
var cAccessPointsWifi = "accessPointsWifi"
var cSpaces = "spaces"
var cCampuses = "campuses"
var cEdges = "edges"
var cFingerprintsWifi = "fingerprintsWifi"
var cFloorplans = "floorplans"
var cPOIS = "pois"
var cUsers = "users"

//// CACHES
var cFingerprintTime = "cFingerprintTime"
var cHeatmapWifi1 = "heatmapWifi1"
var cHeatmapWifi2 = "heatmapWifi2"
var cHeatmapWifi3 = "heatmapWifi3"


// FIELDS
var fAccessToken = "access_token"
var fAddress = "address"
var fBuCode = "bucode"
var fBuid = "buid"
var fBuids = "buids"
var fBuidA = "buid_a"
var fBuidB = "buid_b"
var fCoOwners = "co_owners"
var fCoordinates = "coordinates"
var fCoordinatesLat = "coordinates_lat"
var fCoordinatesLon = "coordinates_lon"
var fCampusCuid = "cuid"
var fConCuid = "cuid"
var fDescription = "description"
var fEdgeType = "edge_type"
var fExternal = "external"
var fFloor = "floor"
var fFloorA = "floor_a"
var fFloorB = "floor_b"
var fFloorName = "floor_name"
var fFloorNumber = "floor_number"
var fFuid = "fuid"
var fGeometry = "geometry"
var fGreeklish = "greeklish"
var fHeading = "heading"
var fId = "_id"
var fIsBuildingEntrance = "is_building_entrance"
var fIsDoor = "is_door"
var fIsPublished = "is_published"
var fImage = "image"
var fLatTopRight = "top_right_lat"
var fLatBottomLeft = "bottom_left_lat"
var fLonBottomLeft = "bottom_left_lng"
var fLonTopRight = "top_right_lng"
var fLocation = "location"
var fMac = "MAC"
var fMeasurements = "measurements"
var fName = "name"
var fOwnerId = "owner_id"
var fPoisA = "pois_a"
var fPoisB = "pois_b"
var fPoisType = "pois_type"
var fPuid = "puid"
var fRSS = "rss"
var fSchema = "_schema"
var fStrongestWifi = "strongestWifi"
var fTimestamp = "timestamp"
var fTimestampX = "timestampX"
var fTimestampY = "timestampY"
var fType = "type"
var fURL = "url"
var fWeight = "weight"
var fX = "x"
var fY = "y"
var fZoom = "zoom"





/*
 * AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
 *
 * Anyplace is a first-of-a-kind indoor information service offering GPS-less
 * localization, navigation and search inside buildings using ordinary smartphones.
 *
 * Author(s): Paschalis Mpeis
 *
 * Supervisor: Demetrios Zeinalipour-Yazti
 *
 * URL: http://anyplace.cs.ucy.ac.cy
 * Contact: anyplace@cs.ucy.ac.cy
 *
 * Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * --------------------------------------------------------------------------------
 *
 * Shared javascript resources among different services:
 *  - anyplace_architect
 *  - anyplace_viewer
 *  - anyplace_viewer_campus
 *
 */

var IMG_ACCESS_POINT_ARCHITECT = 'build/images/wireless-router-icon-bg.png';
var IMG_BUILDING_ARCHITECT = 'build/images/building-icon.png';
// PM: For some reason different dimensions are used for viewer
var IMG_BUILDING_VIEWER = 'build/images/building-icon-viewer.png';
var IMG_FINGERPRINT_RED_SPOT= 'build/images/red_dot.png';

// Activate tooltips
$('document').ready(function(){
    // modal focus fix
    $('#myModal_Welcome').on('shown.bs.modal', function () {
        $('#myModal_Welcome').trigger('focus')
    });

    // Activate tooltips
    if ($("[rel=tooltip]").length) {
        $("[rel=tooltip]").tooltip();
    }
});

function __addAlert(scope, level, msg) {
  // INFO new lines are not displayed.
  // See more here: https://stackoverflow.com/a/14963641/776345
  // msg = msg.replace(/(?:\r\n|\r|\n)/g, '\n');
  scope.anyService.addAlert(level, msg);
};

function _err(scope, msg) {
  __addAlert(scope, 'danger', msg);
};

var _suc = function (scope, msg) {
  __addAlert(scope, 'success', msg);
};

var _warn = function (scope, msg) {
  __addAlert('warning', msg);
};

var _warn_autohide = function (scope, msg) {
  __addAlert(scope, 'warning', msg)
  window.setTimeout(function() {
    $(".alert-warning").fadeTo(500, 0).slideUp(500, function(){
      $(this).remove();
    });
  }, 5000);
};

var _info = function (scope, msg) {
  __addAlert(scope, 'info', msg);
  window.setTimeout(function() {
    $(".alert-info").fadeTo(500, 0).slideUp(500, function(){
      $(this).remove();
    });
  }, 10000);
};

function _ShowAlert(scope, func, response, defaultMsg, showDefaultMessage) {
  var data = response.data;
  var msg = defaultMsg;
  if (data != null && data["message"] != null) {
    if(showDefaultMessage) {
      msg += ": " + data["message"];
    } else {
      msg = data["message"];
    }
  }
  func(scope, msg);
}

/**
 * Show Error message from server's response.
 *
 * @param scope
 * @param response
 * @param defaultMsg
 * @param showDefaultMessage
 */
function ShowError(scope, response, defaultMsg, showDefaultMessage) {
  showDefaultMessage = showDefaultMessage || false;
  _ShowAlert(scope, _err, response, defaultMsg, showDefaultMessage)
}

/**
 *  Show Warning message from server's response that autohides.
 * @param scope
 * @param response
 * @param defaultMsg
 * @param showDefaultMessage
 * @constructor
 */
function ShowWarningAutohide(scope, response, defaultMsg, showDefaultMessage) {
  showDefaultMessage = showDefaultMessage || false;
  _ShowAlert(scope, _warn_autohide, response, defaultMsg, showDefaultMessage)
}

function HandleGeolocationError(scope, errorCode) {
  if (errorCode === 1) {
    _warn_autohide(scope, ERR_GEOLOC_DEVICE_SETTINGS)
  } else if (errorCode === 2) {
      _warn_autohide(scope, ERR_GEOLOC_NET_OR_SATELLITES)
  } else if (errorCode === 3) {
      _warn_autohide(scope, ERR_GEOLOC_TIMEOUT)
  } else {
      _warn_autohide(scope, ERR_GEOLOC_UNKNOWN);
  }
}

function selectAllInputText(element) {
  element.setSelectionRange(0, element.value.length)
}

function getMapsIconBuildingViewer(scope, latLong) {
    // console.log("getMapsIconBuildingViewer")
    var s = new google.maps.Size(27.5, 40);
    if (scope.isFirefox)
        s = new google.maps.Size(55, 80);

    return new google.maps.Marker({
        position: latLong,
        icon: {
            url: IMG_BUILDING_VIEWER,
            size: s,
            scaledSize: new google.maps.Size(27.5, 40)
        },
        draggable: false
    });
}

function getMapsIconBuildingArchitect(gmap, latLong) {
    return new google.maps.Marker({
        position: latLong,
        map: gmap,
        icon: new google.maps.MarkerImage(
            IMG_BUILDING_ARCHITECT,
            null, /* size is determined at runtime */
            null, /* origin is 0,0 */
            null, /* anchor is bottom center of the scaled image */
            new google.maps.Size(54, 54)),
        draggable: false
    });
}

function getMapsIconFingerprint(gmaps, fingerPrintsData) {
    var size = new google.maps.Size(25, 25);
    return new google.maps.Marker({
        position: fingerPrintsData.location,
        map: gmaps,
        icon: new google.maps.MarkerImage(
            IMG_FINGERPRINT_RED_SPOT,
            null, /* size is determined at runtime */
            null, /* origin is 0,0 */
            null, /* anchor is bottom center of the scaled image */
            size
        )
    });
}

function clearFingerprintCoverage() {
    var check = 0;
    if (heatMap[check] !== undefined && heatMap[check] !== null) {

        var i = heatMap.length;
        while (i--) {
            heatMap[i].rectangle.setMap(null);
            heatMap[i] = null;
        }
        heatMap = [];
        document.getElementById("radioHeatmapRSS-mode").classList.remove('quickaction-selected');
        _HEATMAP_FINGERPRINT_COVERAGE = false;
        setColorClicked('g', false);
        setColorClicked('y', false);
        setColorClicked('o', false);
        setColorClicked('p', false);
        setColorClicked('r', false);
        $scope.radioHeatmapRSSMode = false;
        if (typeof (Storage) !== "undefined" && localStorage) {
            localStorage.setItem('radioHeatmapRSSMode', 'NO');
        }
        $scope.anyService.radioHeatmapRSSMode = false;
        $scope.radioHeatmapRSSHasGreen = false;
        $scope.radioHeatmapRSSHasYellow = false;
        $scope.radioHeatmapRSSHasOrange = false;
        $scope.radioHeatmapRSSHasPurple = false;
        $scope.radioHeatmapRSSHasRed = false;
        $cookieStore.put('RSSClicked', 'NO');

    }
}

function clearFingerprintHeatmap() {
    var check = 0;
    if (fingerPrintsMap[check] !== undefined && fingerPrintsMap[check] !== null) {
        var i = fingerPrintsMap.length;
        //hide fingerPrints
        while (i--) {
            fingerPrintsMap[i].setMap(null);
            fingerPrintsMap[i] = null;
        }
        fingerPrintsMap = [];
        _FINGERPRINTS_IS_ON = false;
        document.getElementById("fingerPrints-mode").classList.remove('quickaction-selected');
    }

    if (heatmap && heatmap.getMap()) { //hide fingerPrints heatmap
        heatmap.setMap(null);
        _FINGERPRINTS_IS_ON = false;
        document.getElementById("fingerPrints-mode").classList.remove('quickaction-selected');
        _HEATMAP_F_IS_ON = false;
        var i = heatmapFingerprints.length;
        while (i--) {
            heatmapFingerprints[i] = null;
        }
        heatmapFingerprints = [];
    }
}

function isNullOrEmpty(value){
    return (value == null || value == undefined || value == "" || value == "-");
}

function getPrettyVersion(version) {
   var s = version.version;
   if(version.variant != null && version.variant !== "") {
       s +="-"+version.variant;
   }
   return s;
}

var LOG = {};
LOG.level = 2;
LOG.DBG1 = function() { return 1 <= LOG.level; }
LOG.DBG2 = function() { return 2 <= LOG.level; }
LOG.DBG3 = function() { return 3 <= LOG.level; }
LOG.DBG4 = function() { return 4 <= LOG.level; }

LOG.W = function(msg) { console.log("WARN: " + msg);}
LOG.E = function(msg) { console.log("ERR: " + msg);}
LOG.D = function(msg) { console.log(msg);}
LOG.F = function(msg) { alert(msg); window.stop(); }
LOG.D1 = function(msg) { if (LOG.DBG1()) console.log(msg);}
LOG.D2 = function(msg) { if (LOG.DBG2()) console.log(msg);}
LOG.D3 = function(msg) { if (LOG.DBG3()) console.log(msg);}
LOG.D4 = function(msg) { if (LOG.DBG4()) console.log(msg);}


/*
 * AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
 *
 * Anyplace is a first-of-a-kind indoor information service offering GPS-less
 * localization, navigation and search inside buildings using ordinary smartphones.
 *
 * Author(s): Lambros Petrou, Kyriakos Georgiou
 *
 * Supervisor: Demetrios Zeinalipour-Yazti
 *
 * URL: http://anyplace.cs.ucy.ac.cy
 * Contact: anyplace@cs.ucy.ac.cy
 *
 * Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

CanvasOverlay.prototype = new google.maps.OverlayView();

// https://github.com/wbyoko/angularjs-google-maps-components

/** @constructor */
function CanvasOverlay(image, map) {

    // Now initialize all properties.
    this.top = 0;
    this.left = 0;
    this.width = image.width;
    this.height = image.height;

    while(window && (this.width > window.innerWidth || this.height > window.innerHeight)) {
        this.width /= 2;
        this.height /= 2;
    }

    this.image_ = image;
    this.map_ = map;

    // We define a property to hold the canvas's
    // div. We'll actually create this div
    // upon receipt of the add() method so we'll
    // leave it null for now.
    this.div_ = null;
    this.canvas = null;
    this.ctx = null;
    this.angle = 0;
    this.scale = 1;

    this.latlng = map.getCenter();


    this.new_left = 0;
    this.new_top = 0;


    // Explicitly call setMap on this overlay
    this.setMap(map);
}

CanvasOverlay.prototype.onAdd = function () {


    // Note: an overlay's receipt of add() indicates that
    // the map's panes are now available for attaching
    // the overlay to the map via the DOM.

    // Create the DIV and set some basic attributes.
    var div = document.createElement('div');
    div.id = "canvas_editor";
    div.style.border = 'none';
    div.style.borderWidth = '0px';
    div.style.position = 'relative';
    div.style.top = this.top;
    div.style.left = this.left;

    // initialize the position of the outer div according to the center of the overlay
    // which is the center of the map
    var projection;
    if ((projection = this.getProjection()) != null) {
        var xy = projection.fromLatLngToDivPixel(this.latlng);
        div.style.top = (xy.y - this.height / 2) + 'px';
        div.style.left = (xy.x - this.width / 2) + 'px';
    }

    var self = this;

    jQuery(div).draggable({
        stop: function (event, ui) {
            // update the coordinates
            if (projection != null) {
                var left = $(this).position().left;
                var top = $(this).position().top;
                self.latlng = projection.fromDivPixelToLatLng(new google.maps.Point(left, top), true);
            }
        }
    });

    jQuery(div).resizable({
        aspectRatio: (this.image_.width / this.image_.height),
        ghost: true,
        handles: "sw, se, nw, ne",
        helper: "resizable-helper",
        stop: function (event, ui) {
            self.ctx.clearRect(0, 0, self.ctx.canvas.width, self.ctx.canvas.height);

            self.width = ui.size.width;
            self.height = ui.size.height;

            self.setCanvasSize();

            self.ctx.save();
            self.ctx.translate((self.ctx.canvas.width / 2), (self.ctx.canvas.height / 2));

            self.ctx.drawImage(self.image_, -(self.width / 2), -(self.height / 2), self.width, self.height);
            self.ctx.restore();
        }
    });

    jQuery(div).rotatable({
        stop: function(event, ui) {
            //self.angle = ui.angle.stop;
        }
    });

    // Create a Canvas element and attach it to the DIV.
    var canvas = document.createElement('canvas');
    canvas.id = "canvas";
    div.appendChild(canvas);

    // Set the overlay's div_ property to this DIV
    this.div_ = div;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    // load the floor
    this.initImage();

    // We add an overlay to a map via one of the map's panes.
    // We'll add this overlay to the overlayImage pane.
    var panes = this.getPanes();
    panes.overlayImage.appendChild(this.div_);
    return this;
};

CanvasOverlay.prototype.draw = function () {
    var div = this.div_;

    if (this.canvas == null) {
        alert("error creating the canvas");
    }
};

CanvasOverlay.prototype.onRemove = function () {
    this.div_.parentNode.removeChild(this.div_);
};

// Note that the visibility property must be a string enclosed in quotes
CanvasOverlay.prototype.hide = function () {
    if (this.div_) {
        this.div_.style.visibility = 'hidden';
    }
};

CanvasOverlay.prototype.show = function () {
    if (this.div_) {
        this.div_.style.visibility = 'visible';
    }
};

CanvasOverlay.prototype.toggle = function () {
    if (this.div_) {
        if (this.div_.style.visibility == 'hidden') {
            this.show();
        } else {
            this.hide();
        }
    }
};

CanvasOverlay.prototype.toggleDOM = function () {
    if (this.getMap()) {
        this.setMap(null);
    } else {
        this.setMap(this.map_);
    }
};

/*************************
 * CANVAS METHODS
 */
CanvasOverlay.prototype.getCanvas = function () {
    return this.canvas;
};

CanvasOverlay.prototype.getContext2d = function () {
    return this.ctx;
};


/*****************************
 * EDITING METHODS
 */

CanvasOverlay.prototype.setCanvasSize = function () {
    this.ctx.canvas.width = this.width;
    this.ctx.canvas.height = this.height;

    // we need to change the width and height of the div #canvas_editor
    // which is the element being rotated by the slider
    this.div_.style.width = this.width + 'px';
    this.div_.style.height = this.height + 'px';
};

CanvasOverlay.prototype.initImage = function () {
    this.setCanvasSize();
    this.ctx.save();

    this.ctx.translate((this.ctx.canvas.width / 2), (this.ctx.canvas.height / 2));
    this.ctx.rotate(this.angle);

    this.ctx.drawImage(this.image_, -(this.width / 2), -(this.height / 2), this.width, this.height);
    this.ctx.restore();
};

CanvasOverlay.prototype.drawBoundingCanvas = function () {
    // convert degress rotation to angle radians
    var degrees = getRotationDegrees($('#canvas_editor'));
    //var degrees= parseFloat($('#rot_degrees').val());
    var rads = deg2rad(degrees);
    console.log("deg[" + degrees + "] rad[" + rads + "]");

    $('#canvas_editor').css({
        '-moz-transform': 'rotate(0deg)',
        '-webkit-transform': 'rotate(0deg)',
        '-ms-transform': 'rotate(0deg)',
        '-o-transform': 'rotate(0deg)',
        'transform': 'rotate(0deg)'
    });

    // get the center which we use to rotate the image
    // this is the center when the canvas is rotated at 0 degrees
    var oldCenter = getPositionData($('#canvas_editor'));
    var oldLeft = oldCenter.left;
    var oldTop = oldCenter.top;
    var oldCenterX = oldLeft + this.width / 2;
    var oldCenterY = oldTop + this.height / 2;

    // calculate the 4 new corners - http://stackoverflow.com/a/622172/1066790
    //                             - https://en.wikipedia.org/wiki/Transformation_matrix#Rotation
    var top_left_x = oldCenterX + (oldLeft - oldCenterX) * Math.cos(rads) + (oldTop - oldCenterY) * Math.sin(rads);
    var top_left_y = oldCenterY - (oldLeft - oldCenterX) * Math.sin(rads) + (oldTop - oldCenterY) * Math.cos(rads);
    var top_right_x = oldCenterX + (oldLeft + this.width - oldCenterX) * Math.cos(rads) + (oldTop - oldCenterY) * Math.sin(rads);
    var top_right_y = oldCenterY - (oldLeft + this.width - oldCenterX) * Math.sin(rads) + (oldTop - oldCenterY) * Math.cos(rads);
    var bottom_left_x = oldCenterX + (oldLeft - oldCenterX) * Math.cos(rads) + (oldTop + this.height - oldCenterY) * Math.sin(rads);
    var bottom_left_y = oldCenterY - (oldLeft - oldCenterX) * Math.sin(rads) + (oldTop + this.height - oldCenterY) * Math.cos(rads);
    var bottom_right_x = oldCenterX + (oldLeft + this.width - oldCenterX) * Math.cos(rads) + (oldTop + this.height - oldCenterY) * Math.sin(rads);
    var bottom_right_y = oldCenterY - (oldLeft + this.width - oldCenterX) * Math.sin(rads) + (oldTop + this.height - oldCenterY) * Math.cos(rads);
    // calculate new coordinates finding the top left
    var maxx = Math.max(top_left_x, top_right_x, bottom_left_x, bottom_right_x);
    var maxy = Math.max(top_left_y, top_right_y, bottom_left_y, bottom_right_y);
    var minx = Math.min(top_left_x, top_right_x, bottom_left_x, bottom_right_x);
    var miny = Math.min(top_left_y, top_right_y, bottom_left_y, bottom_right_y);
    var newTop = miny;
    var newLeft = minx;

    var w = maxx - minx;
    var h = maxy - miny;
    console.log("w[" + w + "] h[" + h + "]");

    // move the canvas to the new top left position
    $('#canvas_editor').css({
        'top': newTop + 'px',
        'left': newLeft + 'px'
    })

    this.ctx.canvas.width = w;
    this.ctx.canvas.height = h;
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.translate(oldCenterX - newLeft, oldCenterY - newTop);
    this.ctx.rotate(rads);
    this.ctx.drawImage(this.image_, -(this.width / 2), -(this.height / 2), this.width, this.height);
    this.ctx.restore();

    // we should now update the coordinates for the new image
    this.top = newTop;
    this.left = newLeft;
    var projection;
    if ((projection = this.getProjection()) != null) {
        this.bottom_left_coords = projection.fromContainerPixelToLatLng(new google.maps.Point(this.left, this.top + h), true);
        this.top_right_coords = projection.fromContainerPixelToLatLng(new google.maps.Point(this.left + w, this.top), true);
        //console.log( this.bottom_left_coords + ":" + this.top_right_coords );
    }
}

/***************************************
 * HELPER FUNCTIONS
 */
function deg2rad(deg) {
    return deg * Math.PI / 180;
}
function rad2deg(rad) {
    return rad / Math.PI * 180;
}

function getRotationDegrees(obj) {
    var matrix = obj.css("-webkit-transform") ||
        obj.css("-moz-transform") ||
        obj.css("-ms-transform") ||
        obj.css("-o-transform") ||
        obj.css("transform");
    if (matrix !== 'none') {
        var values = matrix.split('(')[1].split(')')[0].split(',');
        var a = values[0];
        var b = values[1];
        var c = values[2];
        var d = values[3];

        var sin = b / scale;

        var scale = Math.sqrt(a * a + b * b);
        var angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        //var angle = Math.atan2(b, a) * (180/Math.PI);
    } else {
        var angle = 0;
    }
    return angle;
}
// src= http://jsfiddle.net/Y8d6k/
var getPositionData = function (el) {
    return $.extend({
        width: el.outerWidth(false),
        height: el.outerHeight(false)
    }, el.offset());
};
/*
 * AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
 *
 * Anyplace is a first-of-a-kind indoor information service offering GPS-less
 * localization, navigation and search inside buildings using ordinary smartphones.
 *
 * Author(s): Lambros Petrou, Kyriakos Georgiou
 *
 * Supervisor: Demetrios Zeinalipour-Yazti
 *
 * URL: http://anyplace.cs.ucy.ac.cy
 * Contact: anyplace@cs.ucy.ac.cy
 *
 * Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */
    
var LPUtils = {};

LPUtils.isNullOrUndefined = function( t ){
    return (typeof(t) === 'undefined' || t === null);
}

LPUtils.isStringEmptyNullUndefined = function( s ){
    return ( !s || 0 === s.length );
    //return ( typeof(s) === 'undefined' || s === null || 0 === s.length );
}

LPUtils.isStringBlankNullUndefined = function( s ){
    return ( !s || /^\s*$/.test(s) );
}

/************************************
 * UI Functions
 */

LPUtils.alert = function( msg ){
    var np = document.getElementById( "notification_panel" );
    np.innerHTML = "<alert type=\"error\" close=\"LPUtils.closeAlert()\">"+ msg +"</alert>";
}
LPUtils.closeAlert = function(){
    var np = document.getElementById( "notification_panel" );
    np.getEl.innerHTML = "";
}

LPUtils.success = function( msg ){
    var np = document.getElementById( "notification_panel" );
    np.innerHTML = "<alert type=\"success\">"+ msg +"</alert>";
}


function hexToBase64(str) {
    return btoa(String.fromCharCode.apply(null, str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
}

function base64_encode (data) {
    // http://kevin.vanzonneveld.net
    // +   original by: Tyler Akins (http://rumkin.com)
    // +   improved by: Bayron Guevara
    // +   improved by: Thunder.m
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Pellentesque Malesuada
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Rafał Kukawski (http://kukawski.pl)
    // *     example 1: base64_encode('Kevin van Zonneveld');
    // *     returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
    // mozilla has this native
    // - but breaks in 2.0.0.12!
    //if (typeof this.window['btoa'] == 'function') {
    //    return btoa(data);
    //}
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    var r = data.length % 3;

    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);

}

LPUtils.Base64 = {

// private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

// public method for encoding
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = LPUtils.Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

// public method for decoding
    decode : function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = LPUtils.Base64._utf8_decode(output);

        return output;

    },

// private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

// private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}


/**
 * Uses the new array typed in javascript to binary base64 encode/decode
 * at the moment just decodes a binary base64 encoded
 * into either an ArrayBuffer (decodeArrayBuffer)
 * or into an Uint8Array (decode)
 *
 * References:
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
 * https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array
 */

LPUtils.Base64Binary = {
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    /* will return a  Uint8Array type */
    decodeArrayBuffer: function(input) {
        var bytes = (input.length/4) * 3;
        var ab = new ArrayBuffer(bytes);
        this.decode(input, ab);

        return ab;
    },

    decode: function(input, arrayBuffer) {
        //get last chars to see if are valid
        var lkey1 = this._keyStr.indexOf(input.charAt(input.length-1));
        var lkey2 = this._keyStr.indexOf(input.charAt(input.length-2));

        var bytes = (input.length/4) * 3;
        if (lkey1 == 64) bytes--; //padding chars, so skip
        if (lkey2 == 64) bytes--; //padding chars, so skip

        var uarray;
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        var j = 0;

        if (arrayBuffer)
            uarray = new Uint8Array(arrayBuffer);
        else
            uarray = new Uint8Array(bytes);

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        for (i=0; i<bytes; i+=3) {
            //get the 3 octects in 4 ascii chars
            enc1 = this._keyStr.indexOf(input.charAt(j++));
            enc2 = this._keyStr.indexOf(input.charAt(j++));
            enc3 = this._keyStr.indexOf(input.charAt(j++));
            enc4 = this._keyStr.indexOf(input.charAt(j++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            uarray[i] = chr1;
            if (enc3 != 64) uarray[i+1] = chr2;
            if (enc4 != 64) uarray[i+2] = chr3;
        }

        return uarray;
    }
}

/*
 * AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
 *
 * Anyplace is a first-of-a-kind indoor information service offering GPS-less
 * localization, navigation and search inside buildings using ordinary smartphones.
 *
 * Author(s): Lambros Petrou, Kyriakos Georgiou
 *
 * Supervisor: Demetrios Zeinalipour-Yazti
 *
 * URL: http://anyplace.cs.ucy.ac.cy
 * Contact: anyplace@cs.ucy.ac.cy
 *
 * Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

USGSOverlay.prototype = new google.maps.OverlayView();
/** @constructor */
function USGSOverlay(bounds, image, map) {

    // Now initialize all properties.
    this.bounds_ = bounds;
    this.image_ = image;
    this.image64 = image;
    this.map_ = map;

    // We define a property to hold the image's div. We'll
    // actually create this div upon receipt of the onAdd()
    // method so we'll leave it null for now.
    this.div_ = null;

    // Explicitly call setMap on this overlay
    this.setMap(map);
}

USGSOverlay.prototype.onAdd = function() {

    // Note: an overlay's receipt of onAdd() indicates that
    // the map's panes are now available for attaching
    // the overlay to the map via the DOM.

    // Create the DIV and set some basic attributes.
    var div = document.createElement('div');
    div.id="ground_overlay";
    div.style.borderStyle = 'none';
    div.style.borderWidth = '0px';
    div.style.position = 'absolute';

    // Create an IMG element and attach it to the DIV.
    var img = document.createElement('img');
    img.src = this.image64;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.position = 'absolute';
    div.appendChild(img);

    // Set the overlay's div_ property to this DIV
    this.div_ = div;

    // We add an overlay to a map via one of the map's panes.
    // We'll add this overlay to the overlayLayer pane.
    var panes = this.getPanes();
    panes.overlayLayer.appendChild(div);
};

USGSOverlay.prototype.draw = function() {

    // Size and position the overlay. We use a southwest and northeast
    // position of the overlay to peg it to the correct position and size.
    // We need to retrieve the projection from this overlay to do this.
    var overlayProjection = this.getProjection();

    // Retrieve the southwest and northeast coordinates of this overlay
    // in latlngs and convert them to pixels coordinates.
    // We'll use these coordinates to resize the DIV.
    var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
    var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

    // Resize the image's DIV to fit the indicated dimensions.
    var div = this.div_;
    div.style.left = sw.x + 'px';
    div.style.top = ne.y + 'px';
    div.style.width = (ne.x - sw.x) + 'px';
    div.style.height = (sw.y - ne.y) + 'px';
};

USGSOverlay.prototype.onRemove = function() {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
};
/*
 * AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
 *
 * Anyplace is a first-of-a-kind indoor information service offering GPS-less
 * localization, navigation and search inside buildings using ordinary smartphones.
 *
 * Author(s): Kyriakos Georgiou
 *
 * Supervisor: Demetrios Zeinalipour-Yazti
 *
 * URL: http://anyplace.cs.ucy.ac.cy
 * Contact: anyplace@cs.ucy.ac.cy
 *
 * Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

app.controller("AlertController", ['$rootScope', '$scope', 'AnyplaceService', function ($rootScope, $scope, AnyplaceService) {

    $scope.anyService = AnyplaceService;
    $scope.alerts = AnyplaceService.alerts;
    $scope.closeable = true;

}]);
/*
 * AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
 *
 * Anyplace is a first-of-a-kind indoor information service offering GPS-less
 * localization, navigation and search inside buildings using ordinary smartphones.
 *
 * Author(s): Kyriakos Georgiou
 *
 * Supervisor: Demetrios Zeinalipour-Yazti
 *
 * URL: http://anyplace.cs.ucy.ac.cy
 * Contact: anyplace@cs.ucy.ac.cy
 *
 * Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

app.controller('BuildingController',
  ['$scope', '$compile', 'GMapService', 'AnyplaceService', 'AnyplaceAPIService',
  function ($scope, $compile, GMapService, AnyplaceService, AnyplaceAPIService) {
    $scope.gmapService = GMapService;
    $scope.anyService = AnyplaceService;
    $scope.anyAPI = AnyplaceAPIService;
    $scope.myBuildings = [];
    $scope.myBuildingsHashT = {};

    $scope.fetchVersion = function () {
          var jsonReq = {};
          var promise = $scope.anyAPI.version(jsonReq);
          promise.then(
              function (resp) { // on success
                  var data = resp.data;
                  var prettyVersion=getPrettyVersion(data);
                  LOG.D3("Anyplace Version: " + prettyVersion);
                  var element = document.getElementById("anyplace-version");
                  element.textContent = "v"+prettyVersion;
              },
              function (resp) { console.log("Failed to get version: " + resp.data); }
          );
      };
      $scope.fetchVersion();

    var markerCluster = new MarkerClusterer($scope.gmapService.gmap);

    var _setBuildingMarkesVisibility = function (bool) {
        for (var buid in $scope.myBuildingsHashT) {
            if ($scope.myBuildingsHashT.hasOwnProperty(buid)) {
                $scope.myBuildingsHashT[buid].marker.setVisible(bool);
            }
        }
    };

    $scope.$watch('anyService.selectedBuilding', function (newVal, oldVal) {
        if (newVal && newVal.coordinates_lat && newVal.coordinates_lon) {
            // Hide the building's marker for less clutter
            if (!newVal.buid) {
                _err($scope, "Some information is missing from the building and it could not be loaded.");
                return;
            }

            // If you choose to hide all the building markers when a building is selected
            // _setBuildingMarkesVisibility(false);

            // Show last building's marker
            if (oldVal && oldVal.buid) {
                $scope.myBuildingsHashT[oldVal.buid].marker.setVisible(true);
            }

            // hide current buildings marker
            $scope.myBuildingsHashT[newVal.buid].marker.setVisible(false);

            // Pan map to selected building
            $scope.gmapService.gmap.panTo(_latLngFromBuilding(newVal));
            $scope.gmapService.gmap.setZoom(20);

            try {
                if (typeof(Storage) !== "undefined" && localStorage) {
                    localStorage.setItem("lastBuilding", newVal.buid);
                }
            } catch (e) {
            }
        } else {
            _setBuildingMarkesVisibility(true);
        }
    });

    var _latLngFromBuilding = function (b) {
        if (b && b.coordinates_lat && b.coordinates_lon) {
            return {
                lat: parseFloat(b.coordinates_lat),
                lng: parseFloat(b.coordinates_lon)
            }
        }
        return undefined;
    };

    $scope.fetchBuilding = function (buid) {

        var jsonReq = { buid: buid };

        var promise = $scope.anyAPI.getOneBuilding(jsonReq);

        promise.then(
            function (resp) {
                var data = resp.data;
                var b = data.space;

                $scope.myBuildings.push(b);

                // var s = new google.maps.Size(55, 80);
                // if ($scope.isFirefox)
                //     s = new google.maps.Size(110, 160);
                //
                // var marker = new google.maps.Marker({
                //     position: _latLngFromBuilding(b),
                //     icon: {
                //         url: 'build/images/building-icon.png',
                //         size: s,
                //         scaledSize: new google.maps.Size(55, 80)
                //     },
                //     draggable: false
                // });
                // markerCluster.addMarker(marker);
                var marker = getMapsIconBuildingViewer($scope, _latLngFromBuilding(b))
                markerCluster.addMarker(marker);

                var htmlContent = '<div class="infowindow-scroll-fix">'
                    + '<h5>Building:</h5>'
                    + '<span>' + b.name + '</span>'
                    + '<h5>Description:</h5>'
                    + '<textarea class="infowindow-text-area"  rows="3" readonly>' + b.description + '</textarea>'
                    + '</div>';

                marker.infoContent = htmlContent;
                marker.building = b;

                $scope.myBuildingsHashT[b.buid] = {
                    marker: marker,
                    model: b
                };

                google.maps.event.addListener(marker, 'click', function () {
                    infowindow.setContent(this.infoContent);
                    infowindow.open(GMapService.gmap, this);

                    setTimeout(function () {
                        infowindow.setMap(null);
                    }, 2000);

                    var self = this;
                    $scope.$apply(function () {
                        $scope.anyService.selectedBuilding = self.building;
                    });
                });

                $scope.anyService.selectedBuilding = b;
            },
            function (resp) {
                _err($scope, "No matching building found");
            }
        )
    };

    $scope.fetchAllBuildings = function () {
        var jsonReq = {};
        jsonReq.username = $scope.creds.username;
        jsonReq.password = $scope.creds.password;

        var promise = $scope.anyAPI.allBuildings(jsonReq);
        promise.then(
            function (resp) {
                // on success
                var data = resp.data;
                //var bs = JSON.parse( data.buildings );
                $scope.myBuildings = data.spaces;
                $scope.greeklish = data.greeklish;

                var infowindow = new google.maps.InfoWindow({
                    content: '-',
                    maxWidth: 500
                });

                var localStoredBuildingIndex = -1;
                var localStoredBuildingId = undefined;

                try {
                    if (typeof(Storage) !== "undefined" && localStorage && localStorage.getItem('lastBuilding')) {
                        localStoredBuildingId = localStorage.getItem('lastBuilding');
                    }
                } catch (e) {

                }

                var loadBuidFromUrl = -1;
                for (var i = 0; i < $scope.myBuildings.length; i++) {

                    var b = $scope.myBuildings[i];

                    if (localStoredBuildingId && localStoredBuildingId === b.buid) {
                        localStoredBuildingIndex = i;
                    }

                    if (b.is_published === 'true' || b.is_published == true) {
                        b.is_published = true;
                    } else {
                        b.is_published = false;
                    }

                    if ($scope.urlBuid && $scope.urlBuid == b.buid) {
                        loadBuidFromUrl = i;
                    }

                    // var s = new google.maps.Size(55, 80);
                    // if ($scope.isFirefox)
                    //     s = new google.maps.Size(110, 160);
                    // var marker = new google.maps.Marker({
                    //     position: _latLngFromBuilding(b),
                    //     icon: {
                    //         url: 'build/images/building-icon.png',
                    //         size: s,
                    //         scaledSize: new google.maps.Size(55, 80)
                    //     },
                    //     draggable: false
                    // });
                    // markerCluster.addMarker(marker);
                    var marker = getMapsIconBuildingViewer($scope, _latLngFromBuilding(b))
                    markerCluster.addMarker(marker);

                    var htmlContent = '<div class="infowindow-scroll-fix">'
                        + '<h5 style="margin: 0">Building:</h5>'
                        + '<span>' + b.name + '</span>'
                        + '<h5 style="margin: 8px 0 0 0">Description:</h5>'
                        + '<span>' + b.description + '</span>'
                        + '</div>';

                    marker.infoContent = htmlContent;
                    marker.building = b;

                    $scope.myBuildingsHashT[b.buid] = {
                        marker: marker,
                        model: b
                    };

                    google.maps.event.addListener(marker, 'click', function () {
                        infowindow.setContent(this.infoContent);
                        infowindow.open(GMapService.gmap, this);

                        setTimeout(function () {
                            infowindow.setMap(null);
                        }, 2000);

                        var self = this;
                        $scope.$apply(function () {
                            $scope.anyService.selectedBuilding = self.building;
                        });
                    });
                }

                if (loadBuidFromUrl > -1) {
                    $scope.anyService.selectedBuilding = $scope.myBuildings[loadBuidFromUrl];
                } else if ($scope.urlBuid) {
                    $scope.fetchBuilding($scope.urlBuid);
                } else if (localStoredBuildingIndex >= 0) {
                    // using the latest building form localStorage
                    $scope.anyService.selectedBuilding = $scope.myBuildings[localStoredBuildingIndex];
                }
            },
            function (resp) {
              ShowError($scope, resp, ERR_FETCH_BUILDINGS);
            }
        );
    };

    $scope.fetchAllBuildings();

    var _clearBuildingMarkersAndModels = function () {
        for (var b in $scope.myBuildingsHashT) {
            if ($scope.myBuildingsHashT.hasOwnProperty(b)) {
                $scope.myBuildingsHashT[b].marker.setMap(null);
                delete $scope.myBuildingsHashT[b];
            }
        }
    };

    var _calcDistance = function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };

    $scope.orderByName = function (v) { return v.name; };

    $scope.orderByDistCentre = function (v) {
        if ($scope.anyService.selectedBuilding)
            return v.name;
        var c = $scope.gmapService.gmap.getCenter();
        return _calcDistance(parseFloat(v.coordinates_lat), parseFloat(v.coordinates_lon), c.lat(), c.lng());
    }
}]);
/*
 * AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
 *
 * Anyplace is a first-of-a-kind indoor information service offering GPS-less
 * localization, navigation and search inside buildings using ordinary smartphones.
 *
 * Author(s): Kyriakos Georgiou
 *
 * Supervisor: Demetrios Zeinalipour-Yazti
 *
 * URL: http://anyplace.cs.ucy.ac.cy
 * Contact: anyplace@cs.ucy.ac.cy
 *
 * Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

app.controller('ControlBarController', ['$scope', '$rootScope', '$routeParams', '$location', '$compile', 'GMapService', 'AnyplaceService', function ($scope, $rootScope, $routeParams, $location, $compile, GMapService, AnyplaceService) {

    $scope.anyService = AnyplaceService;
    $scope.gmapService = GMapService;

    $scope.isFirefox = navigator.userAgent.search("Firefox") > -1;

    $scope.creds = {
        username: undefined,
        password: undefined
    };

    $scope.user = {
        name: undefined,
        email: undefined,
        username: undefined,
        password: undefined,
        owner_id: undefined,
        access_token: undefined
    }

    $scope.tab = 1;

    var _urlParams = $location.search();
    if (_urlParams) {
        $scope.urlBuid = _urlParams.buid;
        $scope.urlFloor = _urlParams.floor;
        $scope.urlPuid = _urlParams.selected;
        $scope.greeklish = "false";
    }

    $scope.setTab = function (num) {
        $scope.tab = num;
    };

    $scope.isTabSet = function (num) {
        return $scope.tab === num;
    };

    // pass scope to mylocation control in the html
    var myLocControl = $('#my-loc-control');

    myLocControl.replaceWith($compile(myLocControl.html())($scope));
    var myLocMarker = undefined;
    var accuracyRadius = undefined;
    $scope.userPosition = undefined;
    var watchPosNum = -1;

    var pannedToUserPosOnce = false;
    $scope.isUserLocVisible = false;

    $scope.getIsUserLocVisible = function () {
        return $scope.isUserLocVisible;
    };

    $scope.panToUserLocation = function () {
        if (!$scope.userPosition)
            return;

        GMapService.gmap.panTo($scope.userPosition);
        GMapService.gmap.setZoom(20);
    };

    $scope.isMyLocMarkerShown = function () {
        return (myLocMarker && myLocMarker.getMap());
    };

    $scope.displayMyLocMarker = function (posLatlng) {
        if (myLocMarker && myLocMarker.getMap()) {
            myLocMarker.setPosition(posLatlng);
            return;
        }

        var s = new google.maps.Size(20, 20);
        if ($scope.isFirefox)
            s = new google.maps.Size(48, 48);

        myLocMarker = new google.maps.Marker({
            position: posLatlng,
            map: GMapService.gmap,
            draggable: false,
            icon: {
                url: 'build/images/location-radius-centre.png',
                origin: new google.maps.Point(0, 0), /* origin is 0,0 */
                anchor: new google.maps.Point(10, 10), /* anchor is bottom center of the scaled image */
                size: s,
                scaledSize: new google.maps.Size(20, 20)
            }
        });

        //if (accuracyRadius)
        //    accuracyRadius.setMap(null);
        //
        //var accuracyRadiusOptions = {
        //    strokeColor: '#73B9FF',
        //    strokeOpacity: 0.8,
        //    strokeWeight: 2,
        //    fillColor: '#73B9FF',
        //    fillOpacity: 0.35,
        //    map: GMapService.gmap,
        //    center: posLatlng,
        //    radius: radius / 2
        //};
        //// Add the circle for this city to the map.
        //accuracyRadius = new google.maps.Circle(accuracyRadiusOptions);
    };

    $scope.showUserLocation = function () {

        if ($scope.getIsUserLocVisible()) {
            $scope.hideUserLocation();

            if (navigator.geolocation)
                navigator.geolocation.clearWatch(watchPosNum);

            return;
        }

        if (navigator.geolocation) {
            watchPosNum = navigator.geolocation.watchPosition(
                function (position) {

                    var posLatlng = {lat: position.coords.latitude, lng: position.coords.longitude};
                    //var radius = position.coords.accuracy;

                    $scope.userPosition = posLatlng;
                    $scope.displayMyLocMarker(posLatlng);

                    var infowindow = new google.maps.InfoWindow({
                        content: 'Your current location.',
                        maxWidth: 500
                    });

                    google.maps.event.addListener(myLocMarker, 'click', function () {
                        var self = this;
                        $scope.$apply(function () {
                            infowindow.open(GMapService.gmap, self);
                        })
                    });

                    if (!$scope.isUserLocVisible) {
                        $scope.$apply(function () {
                            $scope.isUserLocVisible = true;
                        });
                    }

                    if (!pannedToUserPosOnce) {
                        GMapService.gmap.panTo(posLatlng);
                        GMapService.gmap.setZoom(19);
                        pannedToUserPosOnce = true;
                    }
                },
                function (err) {
                    $scope.$apply(function () {
                        LOG.D2("ControlBarController: geolocation")
                        HandleGeolocationError($scope, err.code);
                    });
                },     {
                    enableHighAccuracy: false,
                    maximumAge: Infinity
                });
        } else {
            _err($scope, ERR_GEOLOC_NOT_SUPPORTED);
        }
    };

    $scope.hideUserLocation = function () {
        if (myLocMarker)
            myLocMarker.setMap(null);
        //if (accuracyRadius)
        //    accuracyRadius.setMap(null);

        $scope.isUserLocVisible = false;
    };

    $scope.showAndroidPrompt = function () {
        try {
            if (typeof(Storage) !== "undefined" && localStorage) {
                if (localStorage.getItem("androidPromptShown")) {
                    var d = $('#android_top_DIV_1');
                    if (d)
                        d.remove();
                }
            }
        } catch (e) {

        }
    };

    $scope.hideAndroidBar = function () {
        var d = $('#android_top_DIV_1');
        if (d)
            d.remove();

        try {
            if (typeof(Storage) !== "undefined" && localStorage) {
                localStorage.setItem("androidPromptShown", true);
            }
        } catch (e) {

        }
    };

    // check if android device to prompt.
    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1 && !ua.indexOf("windows") > -1;
    var d = $('#android_top_DIV_1');
    if (d) if (isAndroid)  d.css({display: 'block'});

    $scope.centerViewToSelectedItem = function () {
        var position = {};
        if ($scope.anyService.selectedPoi) {
            var p = $scope.anyService.selectedPoi;
            position = {lat: parseFloat(p.coordinates_lat), lng: parseFloat(p.coordinates_lon)};
        } else if ($scope.anyService.selectedBuilding) {
            var b = $scope.anyService.selectedBuilding;
            position = {lat: parseFloat(b.coordinates_lat), lng: parseFloat(b.coordinates_lon)};
        } else {
            _err($scope, "No building is selected.");
            return;
        }

        $scope.gmapService.gmap.panTo(position);
        $scope.gmapService.gmap.setZoom(20);
    }

}
])
;

/*
 * AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
 *
 * Anyplace is a first-of-a-kind indoor information service offering GPS-less
 * localization, navigation and search inside buildings using ordinary smartphones.
 *
 * Author(s): Kyriakos Georgiou
 *
 * Supervisor: Demetrios Zeinalipour-Yazti
 *
 * URL: http://anyplace.cs.ucy.ac.cy
 * Contact: anyplace@cs.ucy.ac.cy
 *
 * Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */
app.controller('DropDownCtrl', ['$scope', function ($scope) {
    $scope.items = [
        //'The first choice!',
        //'And another choice for you.',
        //'but wait! A third!'
    ];

    $scope.status = {
        isopen: false
    };

    $scope.toggled = function(open) {
    };

    $scope.toggleDropdown = function($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.status.isopen = !$scope.status.isopen;
    };
}]);
/*
 * AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
 *
 * Anyplace is a first-of-a-kind indoor information service offering GPS-less
 * localization, navigation and search inside buildings using ordinary smartphones.
 *
 * Author(s): Kyriakos Georgiou
 *
 * Supervisor: Demetrios Zeinalipour-Yazti
 *
 * URL: http://anyplace.cs.ucy.ac.cy
 * Contact: anyplace@cs.ucy.ac.cy
 *
 * Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */
app.controller('FloorController', ['$scope', '$compile', 'AnyplaceService', 'GMapService', 'AnyplaceAPIService', function ($scope, $compile, AnyplaceService, GMapService, AnyplaceAPIService) {
    $scope.anyService = AnyplaceService;
    $scope.anyAPI = AnyplaceAPIService;

    $scope.xFloors = [];

    $scope.data = {
        floor_plan_coords: {},
        floor_plan_base64_data: {},
        floor_plan_groundOverlay: null
    };

    var _clearFloors = function () {
        $scope.removeFloorPlan();
        $scope.xFloors = [];
        $scope.myFloorId = 0;
        $scope.myFloors = {};
    };

    $scope.$watch('anyService.selectedBuilding', function (newVal, oldVal) {
        if (newVal && newVal.buid) {
            $scope.fetchAllFloorsForBuilding(newVal);
        } else {
            $scope.removeFloorPlanOverlay();
        }
    });

    $scope.$watch('anyService.selectedFloor', function (newVal, oldVal) {
        if (newVal !== undefined && newVal !== null) {
            $scope.fetchFloorPlanOverlay(newVal);
            GMapService.gmap.panTo(_latLngFromBuilding($scope.anyService.selectedBuilding));
            GMapService.gmap.setZoom(20);

            try {
                if (typeof(Storage) !== "undefined" && localStorage) {
                    localStorage.setItem("lastFloor", newVal.floor_number);
                }
            } catch (e) {

            }
        }
    });

    $scope.removeFloorPlanOverlay = function () {
        if ($scope.data.floor_plan_groundOverlay) {
            $scope.data.floor_plan_groundOverlay.setMap(null);
        }
    };

    var _latLngFromBuilding = function (b) {
        if (b && b.coordinates_lat && b.coordinates_lon) {
            return {
                lat: parseFloat(b.coordinates_lat),
                lng: parseFloat(b.coordinates_lon)
            }
        }
        return undefined;
    };

    $scope.orderByFloorNo = function (floor) {
        if (!floor || LPUtils.isNullOrUndefined(floor.floor_number)) {
            return 0;
        }
        return parseInt(floor.floor_number);
    };

    $scope.fetchAllFloorsForBuilding = function (b) {
        // TODO: check for b.buid
        var jsonReq = AnyplaceService.jsonReq;
        jsonReq.buid = b.buid;

        var promise = AnyplaceAPIService.allBuildingFloors(jsonReq);
        promise.then(
            function (resp) {
                $scope.xFloors = resp.data.floors;

                $scope.xFloors = $scope.xFloors.sort(function (a, b) {
                    return parseInt(a.floor_number) - parseInt(b.floor_number)
                });

                $scope.anyService.availableFloors = {};
                for (var ind = 0; ind < $scope.xFloors.length; ind++) {
                    var fl = $scope.xFloors[ind];
                    $scope.anyService.availableFloors[fl.floor_number] = fl;
                }

                // give priority to floor in url parameter - if exists
                if ($scope.urlFloor) {
                    for (var k = 0; k < $scope.xFloors.length; k++) {
                        if ($scope.urlFloor == $scope.xFloors[k].floor_number) {
                            $scope.anyService.selectedFloor = $scope.xFloors[k];
                            return;
                        }
                    }
                }

                // give 2nd priority to floor found in localStorage
                try {
                    if (typeof(Storage) !== "undefined" && localStorage && !LPUtils.isNullOrUndefined(localStorage.getItem('lastBuilding')) && !LPUtils.isNullOrUndefined(localStorage.getItem('lastFloor'))) {
                        for (var i = 0; i < $scope.xFloors.length; i++) {
                            if (String($scope.xFloors[i].floor_number) === String(localStorage.getItem('lastFloor'))) {
                                $scope.anyService.selectedFloor = $scope.xFloors[i];
                                return;
                            }
                        }
                    }
                } catch (e) {

                }

                // try loading floor 0
                for (var j = 0; j < $scope.xFloors.length; j++) {
                    if ($scope.xFloors[j].floor_number == "0") {
                        $scope.anyService.selectedFloor = $scope.xFloors[j];
                        return;
                    }
                }

                // last resort, default floor
                if ($scope.xFloors[0]) {
                    $scope.anyService.selectedFloor = $scope.xFloors[0];
                }
            },
            function (resp) {
                ShowError($scope, resp, "Something went wrong while fetching all floors", true);
            }
        );
    };

    $scope.fetchFloorPlanOverlay = function () {
        var floor_number = $scope.anyService.selectedFloor.floor_number;
        var buid = $scope.anyService.selectedBuilding.buid;

        var promise = AnyplaceAPIService.downloadFloorPlan(this.anyService.jsonReq, buid, floor_number);
        promise.then(
            function (resp) {

                // in case the building was switched too fast, don't load the old building's
                // floorplan
                if (buid == $scope.anyService.selectedBuilding.buid && floor_number == $scope.anyService.selectedFloor.floor_number) {

                    $scope.data.floor_plan_file = null;
                    $scope.data.floor_plan = null;
                    if ($scope.data.floor_plan_groundOverlay != null) {
                        $scope.data.floor_plan_groundOverlay.setMap(null);
                        $scope.data.floor_plan_groundOverlay = null;
                    }

                    // on success
                    var data = resp.data;

                    // load the correct coordinates from the selected floor
                    var fl = $scope.anyService.selectedFloor;
                    var imageBounds = new google.maps.LatLngBounds(
                        new google.maps.LatLng(fl.bottom_left_lat, fl.bottom_left_lng),
                        new google.maps.LatLng(fl.top_right_lat, fl.top_right_lng));

                    $scope.data.floor_plan_groundOverlay = new USGSOverlay(imageBounds, "data:image/png;base64," + data, GMapService.gmap);
                }
            },
            function (resp) {
                // on error
                // TODO: alert failure
            }
        );
    };

    var canvasOverlay = null;
    $scope.isCanvasOverlayActive = false;

    $scope.setFloorPlan = function () {
        if (!canvasOverlay) {
            return;
        }

        if (AnyplaceService.getBuildingId() === null || AnyplaceService.getBuildingId() === undefined) {
            console.log('building is undefined');
            _err($scope, "Something went wrong. It seems like there is no building selected");
        }

        var newFl = {
            is_published: 'true',
            buid: String(AnyplaceService.getBuildingId()),
            floor_name: String($scope.newFloorNumber),
            description: String($scope.newFloorNumber),
            floor_number: String($scope.newFloorNumber)
        };

        $scope.myFloors[$scope.myFloorId] = newFl;
        $scope.myFloorId++;

        // create the proper image inside the canvas
        canvasOverlay.drawBoundingCanvas();

        // create the ground overlay and destroy the canvasOverlay object
        // and also set the floor_plan_coords in $scope.data
        var bl = canvasOverlay.bottom_left_coords;
        var tr = canvasOverlay.top_right_coords;
        $scope.data.floor_plan_coords.bottom_left_lat = bl.lat();
        $scope.data.floor_plan_coords.bottom_left_lng = bl.lng();
        $scope.data.floor_plan_coords.top_right_lat = tr.lat();
        $scope.data.floor_plan_coords.top_right_lng = tr.lng();
        var data = canvasOverlay.getCanvas().toDataURL("image/png"); // defaults to png
        $scope.data.floor_plan_base64_data = data;
        var imageBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(bl.lat(), bl.lng()),
            new google.maps.LatLng(tr.lat(), tr.lng()));
        $scope.data.floor_plan_groundOverlay = new USGSOverlay(imageBounds, data, GMapService.gmap);

        canvasOverlay.setMap(null); // remove the canvas overlay since the groundoverlay is placed
        $('#input-floor-plan').prop('disabled', false);
        $scope.isCanvasOverlayActive = false;

        $scope.addFloorObject(newFl, $scope.anyService.selectedBuilding, $scope.data);

    };

    $scope.removeFloorPlan = function () {
        $scope.data.floor_plan_file = null;
        $scope.data.floor_plan = null;

        if (canvasOverlay) {
            canvasOverlay.setMap(null);
        }

        var x = $('#input-floor-plan');
        x.replaceWith(x = x.clone(true));

        x.prop('disabled', false);

        $scope.isCanvasOverlayActive = false;
    };

    $scope.floorUp = function () {
        for (var i = 0; i < $scope.xFloors.length; i++) {
            if ($scope.xFloors[i].floor_number == $scope.anyService.selectedFloor.floor_number) {
                if (i + 1 < $scope.xFloors.length) {
                    $scope.anyService.selectedFloor = $scope.xFloors[i + 1];
                    return;
                } else {
                    //_warn("There is no other floor above.");
                    return;
                }
            }
        }

        _err($scope, "Floor not found.");
    };

    $scope.floorDown = function () {
        for (var i = 0; i < $scope.xFloors.length; i++) {
            if ($scope.xFloors[i].floor_number == $scope.anyService.selectedFloor.floor_number) {
                if (i - 1 >= 0) {
                    $scope.anyService.selectedFloor = $scope.xFloors[i - 1];
                    return;
                } else {
                    //_warn("There is no other floor below.");
                    return;
                }
            }
        }

        _err($scope, "Floor not found.");
    };

    // pass scope to floor controls in the html
    var floorControls = $('#floor-controls');
    floorControls.replaceWith($compile(floorControls.html())($scope));
}
])
;

/*
* AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
*
* Anyplace is a first-of-a-kind indoor information service offering GPS-less
* localization, navigation and search inside buildings using ordinary smartphones.
*
* Author(s): Kyriakos Georgiou
*
* Supervisor: Demetrios Zeinalipour-Yazti
*
* URL: http://anyplace.cs.ucy.ac.cy
* Contact: anyplace@cs.ucy.ac.cy
*
* Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
* All rights reserved.
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the “Software”), to deal in the
* Software without restriction, including without limitation the rights to use, copy,
* modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
* and to permit persons to whom the Software is furnished to do so, subject to the
* following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
* OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
* DEALINGS IN THE SOFTWARE.
*
*/

app.controller('LocationSearchController', ['$scope', '$compile', 'GMapService', 'AnyplaceService', 'AnyplaceAPIService', function ($scope, $compile, GMapService, AnyplaceService, AnyplaceAPIService) {

    $scope.gmapService = GMapService;
    $scope.anyService = AnyplaceService;
    $scope.anyAPI = AnyplaceAPIService;

    $scope.myBuildings = [];

    $scope.myBuildingsHashT = {};
    $scope.mylastquery = "";
    $scope.myallPois = [];
    var watchPosNum = -1;

    var self = this;
    self.querySearch = querySearch;

    function querySearch (query) {
        if (query == ""){
            return ;
        }
        if (query == $scope.mylastquery){
            return $scope.myallPois;
        }
        // if (!$scope.userPosition) {
        //  _info($scope, "Enabling the location service will improve your search results.");
        //     $scope.showUserLocation();
        // }


        $scope.anyService.selectedSearchPoi = query;
        setTimeout(
            function(){
                if (query==$scope.anyService.selectedSearchPoi ){
                    $scope.fetchAllPoiBasedOnLocation(query, $scope.userPosition);
                }
            },1000);
        $scope.mylastquery = query;
        return $scope.myallPois;
    }

    $scope.fetchAllPoiBasedOnLocation = function (letters , location) {
        var jsonReq = { "access-control-allow-origin": "", "content-encoding": "gzip",
            "access-control-allow-credentials": "true", "content-length": "17516",
            "content-type": "application/json" , "buid":$scope.buid , "cuid":$scope.urlCampus,
            "letters":letters, "greeklish":$scope.greeklish };
        if (jsonReq.greeklish == null) jsonReq.greeklish = "true";
        var promise = AnyplaceAPIService.retrieveALLPois(jsonReq);
        promise.then(
            function (resp) {
                var data = resp.data;
                $scope.myallPois = data.pois;
                var sz = $scope.myallPois.length;
                for (var i = sz - 1; i >= 0; i--) {
                    $scope.myallPois[i].buname=$scope.myBuildingsnames[$scope.myallPois[i].buid];
                }
            },
            function (resp) {
                if (letters=="") {
                    ShowError($scope, resp,
                      "Something went wrong while fetching POIs", true);
                }
            }
        );
    };


    var markerCluster = new MarkerClusterer($scope.gmapService.gmap);

    var _setBuildingMarkesVisibility = function (bool) {
        for (var buid in $scope.myBuildingsHashT) {
            if ($scope.myBuildingsHashT.hasOwnProperty(buid)) {
                $scope.myBuildingsHashT[buid].marker.setVisible(bool);
            }
        }
    };

    $scope.$watch('anyService.selectedBuilding', function (newVal, oldVal) {
        if (newVal && newVal.coordinates_lat && newVal.coordinates_lon) {

            // Hide the building's marker for less clutter
            if (!newVal.buid) {
                _err($scope, "Some information is missing from the building and it could not be loaded.");
                return;
            }

            // If you choose to hide all the building markers when a building is selected
            _setBuildingMarkesVisibility(false);

            // Show last building's marker
            if (oldVal && oldVal.buid) {
                $scope.myBuildingsHashT[oldVal.buid].marker.setVisible(true);
            }

            // hide current buildings marker
            $scope.myBuildingsHashT[newVal.buid].marker.setVisible(false);

            // Pan map to selected building
            $scope.gmapService.gmap.panTo(_latLngFromBuilding(newVal));
            $scope.gmapService.gmap.setZoom(20);

            try {
                if (typeof(Storage) !== "undefined" && localStorage) {
                    localStorage.setItem("lastBuilding", newVal.buid);
                }
            } catch (e) {

            }
        } else {
            _setBuildingMarkesVisibility(true);
        }
    });

    var _latLngFromBuilding = function (b) {
        if (b && b.coordinates_lat && b.coordinates_lon) {
            return {
                lat: parseFloat(b.coordinates_lat),
                lng: parseFloat(b.coordinates_lon)
            }
        }
        return undefined;
    };

    $scope.fetchBuilding = function (buid) {

        var jsonReq = { buid: buid };

        var promise = $scope.anyAPI.getOneBuilding(jsonReq);

        promise.then(
            function (resp) {
                var data = resp.data;
                var b = data.space;

                $scope.myBuildings.push(b);


                // var s = new google.maps.Size(55, 80);
                // if ($scope.isFirefox)
                //     s = new google.maps.Size(110, 160);
                //
                // var marker = new google.maps.Marker({
                //     position: _latLngFromBuilding(b),
                //     icon: {
                //         url: 'build/images/building-icon.png',
                //         size: s,
                //         scaledSize: new google.maps.Size(55, 80)
                //     },
                //     draggable: false
                // });
                // markerCluster.addMarker(marker);
                var marker = getMapsIconBuildingViewer($scope, _latLngFromBuilding(b));
                markerCluster.addMarker(marker);

                var htmlContent = '<div class="infowindow-scroll-fix">'
                    + '<h5>Building:</h5>'
                    + '<span>' + b.name + '</span>'
                    + '<h5>Description:</h5>'
                    + '<textarea class="infowindow-text-area"  rows="3" readonly>' + b.description + '</textarea>'
                    + '</div>';

                marker.infoContent = htmlContent;
                marker.building = b;

                $scope.myBuildingsHashT[b.buid] = {
                    marker: marker,
                    model: b
                };

                google.maps.event.addListener(marker, 'click', function () {
                    infowindow.setContent(this.infoContent);
                    infowindow.open(GMapService.gmap, this);

                    setTimeout(function () {
                        infowindow.setMap(null);
                    }, 2000);

                    var self = this;
                    $scope.$apply(function () {
                        $scope.anyService.selectedBuilding = self.building;
                    });
                });

                $scope.anyService.selectedBuilding = b;
            },
            function (resp) {
                _err($scope, "No matching building found");
            }
        )

    };

    $scope.fetchAllBuildings = function () {
        var jsonReq = {};
        jsonReq.username = $scope.creds.username;
        jsonReq.password = $scope.creds.password;

        var promise = $scope.anyAPI.allBuildings(jsonReq);
        promise.then(
            function (resp) {
                // on success
                var data = resp.data;
                //var bs = JSON.parse( data.buildings );
                $scope.myBuildings = data.spaces;
                $scope.greeklish = data.greeklish;

                var infowindow = new google.maps.InfoWindow({
                    content: '-',
                    maxWidth: 500
                });

                var localStoredBuildingIndex = -1;
                var localStoredBuildingId = undefined;

                try {
                    if (typeof(Storage) !== "undefined" && localStorage && localStorage.getItem('lastBuilding')) {
                        localStoredBuildingId = localStorage.getItem('lastBuilding');
                    }
                } catch (e) {

                }

                var loadBuidFromUrl = -1;

                for (var i = 0; i < $scope.myBuildings.length; i++) {

                    var b = $scope.myBuildings[i];

                    if (localStoredBuildingId && localStoredBuildingId === b.buid) {
                        localStoredBuildingIndex = i;
                    }

                    if (b.is_published === 'true' || b.is_published == true) {
                        b.is_published = true;
                    } else {
                        b.is_published = false;
                    }

                    if ($scope.urlBuid && $scope.urlBuid == b.buid) {
                        loadBuidFromUrl = i;
                    }

                    // var s = new google.maps.Size(55, 80);
                    // if ($scope.isFirefox)
                    //     s = new google.maps.Size(110, 160);
                    // var marker = new google.maps.Marker({
                    //     position: _latLngFromBuilding(b),
                    //     icon: {
                    //         url: 'build/images/building-icon.png',
                    //         size: s,
                    //         scaledSize: new google.maps.Size(55, 80)
                    //     },
                    //     draggable: false
                    // });
                    // markerCluster.addMarker(marker);
                    var marker = getMapsIconBuildingViewer($scope, _latLngFromBuilding(b));
                    markerCluster.addMarker(marker);

                    var htmlContent = '<div class="infowindow-scroll-fix">'
                        + '<h5 style="margin: 0">Building:</h5>'
                        + '<span>' + b.name + '</span>'
                        + '<h5 style="margin: 8px 0 0 0">Description:</h5>'
                        + '<span>' + b.description + '</span>'
                        + '</div>';

                    marker.infoContent = htmlContent;
                    marker.building = b;

                    $scope.myBuildingsHashT[b.buid] = {
                        marker: marker,
                        model: b
                    };

                    google.maps.event.addListener(marker, 'click', function () {
                        infowindow.setContent(this.infoContent);
                        infowindow.open(GMapService.gmap, this);

                        setTimeout(function () {
                            infowindow.setMap(null);
                        }, 2000);

                        var self = this;
                        $scope.$apply(function () {
                            $scope.anyService.selectedBuilding = self.building;
                        });
                    });
                }

                if (loadBuidFromUrl > -1) {
                    $scope.anyService.selectedBuilding = $scope.myBuildings[loadBuidFromUrl];
                } else if ($scope.urlBuid) {
                    $scope.fetchBuilding($scope.urlBuid);
                } else if (localStoredBuildingIndex >= 0) {
                    // using the latest building form localStorage
                    $scope.anyService.selectedBuilding = $scope.myBuildings[localStoredBuildingIndex];
                }
            },
            function (resp) {
              ShowError($scope, resp, ERR_FETCH_BUILDINGS);
            }
        );
    };

    $scope.fetchAllBuildings();

    var _clearBuildingMarkersAndModels = function () {
        for (var b in $scope.myBuildingsHashT) {
            if ($scope.myBuildingsHashT.hasOwnProperty(b)) {
                $scope.myBuildingsHashT[b].marker.setMap(null);
                delete $scope.myBuildingsHashT[b];
            }
        }
    };


    var _calcDistance = function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };

    $scope.orderByName = function (v) {
        return v.name;
    };

    $scope.orderByDistCentre = function (v) {
        if ($scope.anyService.selectedBuilding)
            return v.name;
        var c = $scope.gmapService.gmap.getCenter();
        return _calcDistance(parseFloat(v.coordinates_lat), parseFloat(v.coordinates_lon), c.lat(), c.lng());
    }

}]);

/*
 * AnyPlace: A free and open Indoor Navigation Service with superb accuracy!
 *
 * Anyplace is a first-of-a-kind indoor information service offering GPS-less
 * localization, navigation and search inside buildings using ordinary smartphones.
 *
 * Author(s): Costantinos Costa, Kyriakos Georgiou
 *
 * Supervisor: Demetrios Zeinalipour-Yazti
 *
 * URL: http://anyplace.cs.ucy.ac.cy
 * Contact: anyplace@cs.ucy.ac.cy
 *
 * Copyright (c) 2015, Data Management Systems Lab (DMSL), University of Cyprus.
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the “Software”), to deal in the
 * Software without restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

app.controller('PoiController', ['$scope', '$compile', 'GMapService', 'AnyplaceService', 'AnyplaceAPIService', function ($scope, $compile, GMapService, AnyplaceService, AnyplaceAPIService) {

    // var _POI_CONNECTOR_IMG = 'build/images/edge-connector-icon.png';
    // var _POI_EXISTING_IMG = 'build/images/any-poi-icon-blue.png';
    // var _POI_NEW_IMG = 'build/images/poi-icon.png';
    var _POI_EXISTING_IMG = 'build/images/poi.png';
    var _POI_NEW_IMG = 'build/images/poi-new.png';


    var _MARKERS_IMG_RAW_SIZE = new google.maps.Size(62, 93);
    var _MARKERS_IMG_RAW_SIZEsq = new google.maps.Size(93, 93);

    // 21, 32 old size
    var _MARKERS_SIZE_NORMAL = new google.maps.Size(21, 32);
    var _MARKERS_SIZE_NORMALsq = new google.maps.Size(32, 32);
    // var _MARKERS_SIZE_BIG = new google.maps.Size(31, 48);
    var _MARKERS_SIZE_BIGsq = new google.maps.Size(48, 48);
    var HIDE_POIS_ZOOM_LEVEL = 17;

    $scope.anyService = AnyplaceService;
    $scope.anyAPI = AnyplaceAPIService;
    $scope.gmapService = GMapService;

    $scope.myPois = [];
    $scope.myPoisHashT = {};

    $scope.myEntrances = [];



    $scope.showPoiDescription = false;
    $scope.poiShareUrl = {
        puid: undefined,
        url: '...'
    };

    $scope.poiRouteState = {
        form: undefined
    };



    $scope.mylastquery = "";
    $scope.myallPois = [];
    var self = this;
    self.querySearch = querySearch;

    function querySearch (query){
        if (query == ""){
            return $scope.myPois;
        }
        if (query == $scope.mylastquery){
            return $scope.myallPois;
        }
        $scope.anyService.selectedSearchPoi = query;
        setTimeout(
            function(){
                if (query==$scope.anyService.selectedSearchPoi ){
                    $scope.fetchAllPoi(query, $scope.anyService.selectedBuilding.buid);
                }
            },1000);
        $scope.mylastquery = query;
        return
    }

    $scope.fetchAllPoi = function (letters , buid) {
        var jsonReq = { "access-control-allow-origin": "",    "content-encoding": "gzip",
            "access-control-allow-credentials": "true",    "content-length": "17516",
            "content-type": "application/json" , "buid":buid, "cuid":"", "letters":letters, "greeklish":$scope.greeklish };
        if (jsonReq.greeklish == null) jsonReq.greeklish = "true";
        var promise = AnyplaceAPIService.retrieveALLPois(jsonReq);
        promise.then(
            function (resp) {
                var data = resp.data;
                $scope.myallPois = data.pois;
            },
            function (resp) {
                if (letters=="") {
                    ShowError($scope, resp,
                      "Something went wrong while fetching POIs", true);
                }
            }
        );
    };

    $scope.togglePoiDescription = function () {
        $scope.showPoiDescription = !$scope.showPoiDescription;
    };

    var poiClosestToUserPos = undefined;

    var poiRoutePolyline = {};
    var auxPoiRoutePolyline = undefined;
    var userToPoiPolyline = undefined;

    var arePoisLoaded = false;
    var prevSelectedPoi = undefined;

    google.maps.event.addListener($scope.gmapService.gmap, 'zoom_changed', function () {
        var zoom = this.getZoom();
        // iterate over markers and call setVisible
        if (zoom <= HIDE_POIS_ZOOM_LEVEL) {
            _hidePoisOnMap();
        } else {
            _makeVisiblePoisOnMap();
        }
    });

    var _closeActiveInfoWindow = function () {
        if ($scope.anyService.selectedPoi) {
            var poi = $scope.anyService.selectedPoi;
            if (poi.puid && $scope.myPoisHashT[poi.puid] && $scope.myPoisHashT[poi.puid].marker && $scope.myPoisHashT[poi.puid].marker.infowindow) {
                $scope.myPoisHashT[poi.puid].marker.infowindow.setMap(null);
            }
        }
    };

    // hide the info window on click anywhere on the map..
    google.maps.event.addListener($scope.gmapService.gmap, 'click', function () {
        _closeActiveInfoWindow();
    });

    $scope.$watch('anyService.selectedBuilding', function (newVal, oldVal) {
        if (newVal && newVal.buid) {
            arePoisLoaded = false;
            $scope.removePoisOnMap();
            $scope.myEntrances = [];
            $scope.myPoisHashT = {};
            $scope.fetchAllPoisForBuilding(newVal);
            $scope.clearNavPolylines();
        } else {
            $scope.anyService.selectedPoi = undefined;
            $scope.removePoisOnMap();
            $scope.clearNavPolylines();
        }
    });

    $scope.$watch('anyService.selectedFloor', function (newVal, oldVal) {
        if (newVal !== undefined && newVal !== null && arePoisLoaded) {
            if (newVal.floor_number) {
                $scope.showPoisOnlyForFloor(newVal.floor_number);
            }
            _displayPolylineForFloor(newVal, oldVal);
        } else {
            $scope.anyService.selectedPoi = undefined;
        }
    });

    $scope.$watch('anyService.selectedPoi', function (newVal, oldVal) {
        if (newVal && newVal.puid && _latLngFromPoi(newVal)) {

            $scope.poiShareUrl.puid = undefined;
            $scope.poiShareUrl.url = '...';

            if ($scope.anyService.getFloorNumber() != newVal.floor_number) {
                $scope.anyService.setSelectedFloorByNum(newVal.floor_number);
            }

            GMapService.gmap.panTo(_latLngFromPoi(newVal));
            GMapService.gmap.setZoom(20);

            // make marker bigger and open infowindow
            if (newVal.puid && $scope.myPoisHashT[newVal.puid] && $scope.myPoisHashT[newVal.puid].marker) {
                var m = $scope.myPoisHashT[newVal.puid].marker;

                m.setVisible(true);
                m.setIcon(_getBiggerPoiIcon(newVal));

                if (m.infowindow) {
                    m.infowindow.setContent(m.tpl2);
                    m.infowindow.open(GMapService.gmap, m);
                }
            }

            // make previous selected POI's marker smaller
            if (prevSelectedPoi && prevSelectedPoi.puid && $scope.myPoisHashT[prevSelectedPoi.puid] && $scope.myPoisHashT[prevSelectedPoi.puid].marker) {
                $scope.myPoisHashT[prevSelectedPoi.puid].marker.setIcon(_getNormalPoiIconNormal(prevSelectedPoi));
                if (GMapService.gmap.getZoom() <= HIDE_POIS_ZOOM_LEVEL) {
                    $scope.myPoisHashT[prevSelectedPoi.puid].marker.setVisible(false);
                }
            }

            try {
                if (typeof(Storage) !== "undefined" && localStorage)
                    localStorage.setItem("lastPoi", newVal.puid);
            } catch (e) {
            }

            prevSelectedPoi = newVal;

        }
    });

    var _latLngFromPoi = function (p) {
        if (p && p.coordinates_lat && p.coordinates_lon) {
            return {lat: parseFloat(p.coordinates_lat), lng: parseFloat(p.coordinates_lon)}
        }
        return undefined;
    };

    $scope.orderByName = function (value) {
        return value.name;
    };

    $scope.orderByFloor = function (value) {
        return parseInt(value.floor_number) + value.name;
    };

    // standard poi icon requires a square NxN size
    var _getImageIconSizeForPoi = function (poi) {
        var sz=_MARKERS_SIZE_NORMALsq;
        if ($scope.isFirefox)
            sz=_MARKERS_IMG_RAW_SIZEsq;

        if (poi.is_building_entrance && poi.is_building_entrance ||
        poi.pois_type === "Stair" ||
        poi.pois_type === "Elevator") {
            sz=_MARKERS_SIZE_NORMAL;
            if ($scope.isFirefox)
                sz=_MARKERS_IMG_RAW_SIZE;
        }

        return sz;
    }


    var _getImageIconForPoi = function (poi) {
        // var img = 'build/images/any-poi-icon-blue.png';
	var _POI_EXISTING_IMG = 'build/images/poi.png';
        var img = _POI_EXISTING_IMG;

        if (poi.is_building_entrance && poi.is_building_entrance !== "false") {
            img = 'build/images/poi_icon_entrance-green.png';
        } else if (poi.pois_type === "Stair") {
            img = 'build/images/poi_icon_stairs-orange.png';
        } else if (poi.pois_type === "Elevator") {
            img = 'build/images/poi_icon_elevator-purple.png';
        }

        return img;
    };

    var _getBiggerPoiIcon = function (poi) {
	// var img = _getImageIconForPoi(poi).replace(/\-[a-z]+\.png/gi, "-red.png");
        var _POI_NEW_IMG = 'build/images/poi-new.png';
        var img = _POI_NEW_IMG;

        var s = _MARKERS_SIZE_BIGsq;
        if ($scope.isFirefox)
            s = _MARKERS_IMG_RAW_SIZE;

        return {
            url: img,
            size: s,
            scaledSize: _MARKERS_SIZE_BIGsq
        }
    };

    var _getNormalPoiIconNormal = function (poi) {
        return {
            url: _getImageIconForPoi(poi),
            size: _getImageIconSizeForPoi(poi),
            scaledSize: _getImageIconSizeForPoi(poi)}
    };

    var _clearPoiRoutePolyline = function () {
        for (var fkey in poiRoutePolyline) {
            if (poiRoutePolyline.hasOwnProperty(fkey)) {
                if (poiRoutePolyline[fkey].polyline) {
                    poiRoutePolyline[fkey].polyline.setMap(null);
                }
            }
        }
        poiRoutePolyline = {};
    };

    var _displayPolylineForFloor = function (newFl, oldFl) {

        if (poiRoutePolyline) {
            if (newFl && newFl.floor_number) {
                var nf = newFl.floor_number;
                if (poiRoutePolyline[nf] && poiRoutePolyline[nf].polyline) {
                    poiRoutePolyline[nf].polyline.setMap($scope.gmapService.gmap);
                }
            }

            if (oldFl && oldFl.floor_number) {
                var of = oldFl.floor_number;
                if (poiRoutePolyline[of] && poiRoutePolyline[of].polyline) {
                    poiRoutePolyline[of].polyline.setMap(null);
                }
            }
        }
    };

    $scope.unselectBuilding = function () {
        $scope.anyService.selectedBuilding = undefined;

        // TODO: remove form local storage
        try {
            if (typeof(Storage) !== "undefined" && localStorage)
                localStorage.removeItem("lastBuilding");
            localStorage.removeItem("lastFloor");
            localStorage.removeItem("lastPoi");
        } catch (e) {
        }

    };

    $scope.clearNavPolylines = function () {

        _clearPoiRoutePolyline();

        if (auxPoiRoutePolyline)
            auxPoiRoutePolyline.setMap(null);

        if (GMapService.isRouteShown())
            GMapService.clearRoute();

        if (userToPoiPolyline)
            userToPoiPolyline.setMap(null);

        // hide the user's location marker in case the navigation happened for one time only
        // (the continuous localization was turned off)
        if (!$scope.getIsUserLocVisible()) {
            $scope.hideUserLocation();
        }
    };

    $scope.navRoutesShown = function () {
        for (var fkey in poiRoutePolyline) {
            if (poiRoutePolyline.hasOwnProperty(fkey)) {
                if (poiRoutePolyline[fkey].polyline && poiRoutePolyline[fkey].polyline.getMap()) {
                    return true;
                }
            }
        }

        if (auxPoiRoutePolyline && auxPoiRoutePolyline.getMap())
            return true;

        if (GMapService.isRouteShown())
            return true;

        return false;
    };

    $scope.zoomInPoi = function () {
        $scope.gmapService.gmap.panTo(_latLngFromPoi($scope.anyService.selectedPoi));
        $scope.gmapService.gmap.setZoom(20);
    };

    $scope.fetchAllPoisForBuilding = function (building) {

        var jsonReq = AnyplaceService.jsonReq;
        jsonReq.buid = building.buid;

        var promise = AnyplaceAPIService.retrievePoisByBuilding(jsonReq);
        promise.then(
            function (resp) {
                var data = resp.data;

                $scope.myPois = data.pois;

                var sz = $scope.myPois.length;
                for (var i = sz - 1; i >= 0; i--) {
                    var puid = $scope.myPois[i].puid;

                    if ($scope.myPois[i].is_building_entrance === 'true') {
                        $scope.myPois[i].is_building_entrance = true;
                        // add poi to entrances array for faster processing later
                        $scope.myEntrances.push($scope.myPois[i]);
                    } else {
                        $scope.myPois[i].is_building_entrance = false;
                    }

                    // insert the pois inside the hashtable
                    $scope.myPoisHashT[puid] = {};
                    $scope.myPoisHashT[puid].model = $scope.myPois[i];
                }

                arePoisLoaded = true;

                $scope.drawPoisOnMapForBuilding();
                $scope.showPoisOnlyForFloor($scope.anyService.getFloorNumber());
            },
            function (resp) {
                ShowError($scope, resp, "Something went wrong while fetching POIs", true);
            }
        );
    };

    $scope.retrieveRouteFromPoiToPoi = function (from, to) {
        if (!from || !from.puid) {
            _err($scope, "Source POI is corrupted.");
            return;
        }
        if (!to || !to.puid) {
            _err($scope, "Source POI is corrupted.");
            return;
        }
        var jsonReq = $scope.creds;
        jsonReq.pois_from = from.puid;
        jsonReq.pois_to = to.puid;
        var promise = AnyplaceAPIService.retrieveRouteFromPoiToPoi(jsonReq);
        promise.then(
            function (resp) {
                var data = resp.data;
                var listPois = data.pois;
                _clearPoiRoutePolyline();
                for (var i = 0; i < listPois.length; i++) {
                    if (listPois[i].lat && listPois[i].lon && listPois[i].floor_number) {
                        var fl = listPois[i].floor_number;
                        if (!poiRoutePolyline.hasOwnProperty(fl)) {
                            poiRoutePolyline[fl] = {
                                flightPlanCoordinates: []
                            };
                        }
                        poiRoutePolyline[fl].flightPlanCoordinates.push(new google.maps.LatLng(
                            parseFloat(listPois[i].lat),
                            parseFloat(listPois[i].lon)
                        ));
                    }
                }
                for (var fkey in poiRoutePolyline) {
                    if (poiRoutePolyline.hasOwnProperty(fkey)) {
                        poiRoutePolyline[fkey].polyline = new google.maps.Polyline({
                            path: poiRoutePolyline[fkey].flightPlanCoordinates,
                            geodesic: true,
                            strokeColor: '#FF0000',
                            strokeOpacity: 0.75,
                            strokeWeight: 6
                        });
                        if ($scope.anyService.selectedFloor.floor_number === fkey)
                            poiRoutePolyline[fkey].polyline.setMap($scope.gmapService.gmap);
                    }
                }
                // user is in the building
                if (poiClosestToUserPos) {
                    var lineSymbol = {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 0.75,
                        scale: 4
                    };
                    userToPoiPolyline = new google.maps.Polyline({
                        path: [
                            new google.maps.LatLng(parseFloat(from.coordinates_lat), parseFloat(from.coordinates_lon)),
                            new google.maps.LatLng($scope.userPosition.lat, $scope.userPosition.lng)
                        ],
                        geodesic: true,
                        strokeColor: '#FF0000',
                        strokeOpacity: 0,
                        strokeWeight: 6,
                        icons: [{
                            icon: lineSymbol,
                            offset: '0',
                            repeat: '20px'
                        }]
                    });
                    userToPoiPolyline.setMap($scope.gmapService.gmap);
                    poiClosestToUserPos = undefined;
                }
            },
            function (resp) {
                ShowError($scope, resp, "Something went wrong while fetching route.", true);
            }
        );

    };

    var _euclideanDistance = function (x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    };

    /**
     *
     * @param a The last point of google navigation
     * @param b The target POI inside the building
     * @returns The entrance POI
     * @private
     */
    var _findClosestEntranceFrom2Points = function (a, b) {

        var xa = a.lat();
        var ya = a.lng();

        var xb = parseFloat(b.coordinates_lat);
        var yb = parseFloat(b.coordinates_lon);

        var entr = $scope.myEntrances;

        // If there are building entrance we will use those as entrance
        // point to our target destination
        if (!entr || !entr.length)
            entr = $scope.myPois;


        var minD = Number.MAX_VALUE;
        var minPoi = undefined;

        for (var i = 0; i < entr.length; i++) {
            if (entr[i].puid === b.puid)
                continue;

            var x = parseFloat(entr[i].coordinates_lat);
            var y = parseFloat(entr[i].coordinates_lon);

            var d;
            if (entr && entr.length > 0)
                d = _euclideanDistance(xa, ya, x, y) + _euclideanDistance(xb, yb, x, y);
            else
                d = _euclideanDistance(xa, ya, x, y);

            if (d < minD) {
                minD = d;
                minPoi = entr[i];
            }
        }

        return minPoi;
    };

    var _findClosestEntranceFrom1Point = function (b) {
        var xb = parseFloat(b.coordinates_lat);
        var yb = parseFloat(b.coordinates_lon);

        var entr = $scope.myEntrances;

        // If there are building entrance we will use those as entrance
        // point to our target destination
        if (!entr || !entr.length)
            entr = $scope.myPois;

        var minD = Number.MAX_VALUE;
        var minPoi = undefined;

        for (var i = 0; i < entr.length; i++) {
            if (entr[i].puid == b.puid) {
                // the poi is a door itself
                return b;
            }

            var x = parseFloat(entr[i].coordinates_lat);
            var y = parseFloat(entr[i].coordinates_lon);

            var d;
            if (entr && entr.length > 0)
                d = _euclideanDistance(xb, yb, x, y);

            if (d < minD) {
                minD = d;
                minPoi = entr[i];
            }
        }

        return minPoi;
    };

    $scope.getPoiShareUrl = function (puid) {

        if (puid === $scope.poiShareUrl.puid) {
            $scope.poiShareUrl.puid = undefined;
            return;
        }

        $scope.poiShareUrl.puid = puid;

        if (!$scope.anyService.selectedPoi || $scope.anyService.selectedPoi.puid != puid) {
            $scope.anyService.selectedPoi = $scope.myPoisHashT[puid].model;
        }
        var viewerUrl = "https://anyplace.cs.ucy.ac.cy/viewer/?"+$scope.anyService.getViewerUrl();

        $scope.poiShareUrl.embed = '<iframe width="100%" height="500" frameborder="0" scrolling="yes" marginheight="0" marginwidth="0" src="' + viewerUrl + '"></iframe>';

        var json_req = {
            longUrl: viewerUrl
        };

        var promise = $scope.anyAPI.googleUrlShortener(json_req);
        promise.then(
            function (resp) {
                $scope.poiShareUrl.url = resp.data.id;
                //prompt("Copy & Share:", resp.data.id);
            },
            function (resp) {
                $scope.poiShareUrl.url = viewerUrl;
                //prompt("Copy & Share:", viewerUrl);
            }
        );
    };

    $scope.startNavFromPoi = function () {
        $scope.poiRouteState.from = $scope.anyService.selectedPoi;
        _suc($scope, "Now you can click on another POI to draw the indoor path between the 2 points.");
    };

    $scope.getHtml5GeoLocation = function (callback, errCallback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(callback, errCallback);
        } else {
            _err($scope, "Geolocation is not supported by this browser.");
        }
    };

    $scope.navigateFromUserToPoiAux = function (position) {
        if (!position) {
            _err($scope, "Invalid position detected by HTML5.");
            return;
        }

        var lat = position.lat;
        var lng = position.lng;

        if (!$scope.userPosition) {
            $scope.userPosition = {lat: lat, lng: lng};
        }

        var latLngPos = new google.maps.LatLng(lat, lng);

        var targetPoi = $scope.anyService.selectedPoi;

        if (!targetPoi) {
            _err($scope, "No target poi found.");
            return;
        }

        if (_isPointInSelectedFloor(lat, lng)) {
            var minD = Number.MAX_VALUE;
            var minP = undefined;
            var ht = $scope.myPoisHashT;
            var d;
            for (var k in ht) {
                if (ht.hasOwnProperty(k)) {
                    var p = ht[k].model;
                    if (!p || p.floor_number != targetPoi.floor_number)
                        continue;
                    if ((d = _euclideanDistance(
                                parseFloat(p.coordinates_lat), parseFloat(p.coordinates_lon),
                                lat, lng)
                        ) <= minD) {
                        minD = d;
                        minP = p;
                    }
                }
            }
            poiClosestToUserPos = minP;
            $scope.retrieveRouteFromPoiToPoi(minP, targetPoi);
            if (!$scope.getIsUserLocVisible()) {
                $scope.displayMyLocMarker({lat: lat, lng: lng});
            }

            return;
        } else {
            poiClosestToUserPos = undefined;
        }

        var targetLatLng = new google.maps.LatLng(
            parseFloat(targetPoi.coordinates_lat),
            parseFloat(targetPoi.coordinates_lon));

        var targetEntrance = _findClosestEntranceFrom1Point(targetPoi);

        if (targetEntrance) {
            targetLatLng = new google.maps.LatLng(
                parseFloat(targetEntrance.coordinates_lat),
                parseFloat(targetEntrance.coordinates_lon));
        }

        $scope.gmapService.calcRoute(latLngPos, targetLatLng, function (lastPoint) {
            if (lastPoint) {
                var trgtPoi = $scope.anyService.selectedPoi;

                if (targetEntrance) {
                    var ep = targetEntrance;

                    var flightPath = [
                        lastPoint,
                        new google.maps.LatLng(parseFloat(ep.coordinates_lat), parseFloat(ep.coordinates_lon))
                    ];

                    if (auxPoiRoutePolyline)
                        auxPoiRoutePolyline.setMap(null);

                    var lineSymbol = {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: 0.75,
                        scale: 4
                    };

                    auxPoiRoutePolyline = new google.maps.Polyline({
                        path: flightPath,
                        geodesic: true,
                        strokeColor: '#73B9FF',
                        strokeOpacity: 0,
                        strokeWeight: 6,
                        icons: [{
                            icon: lineSymbol,
                            offset: '0',
                            repeat: '20px'
                        }]
                    });

                    auxPoiRoutePolyline.setMap($scope.gmapService.gmap);

                    if (ep.puid != trgtPoi.puid)
                        $scope.retrieveRouteFromPoiToPoi(ep, trgtPoi);
                }

            }
        });
    };

    $scope.navigateFromUserToPoi = function (puid) {

        if (!$scope.anyService.selectedPoi || $scope.anyService.selectedPoi.puid != puid) {
            $scope.anyService.selectedPoi = $scope.myPoisHashT[puid].model;
        }

        if ($scope.getIsUserLocVisible() && $scope.userPosition) {
            $scope.navigateFromUserToPoiAux($scope.userPosition);
        } else {
            $scope.getHtml5GeoLocation(
                function (position) {
                    var lat = position.coords.latitude;
                    var lng = position.coords.longitude;
                    $scope.navigateFromUserToPoiAux({lat: lat, lng: lng});
                },
                function (err) {
                    $scope.$apply(function () {
                        LOG.E("PoiController: getHtml5GeoLocation")
                        HandleGeolocationError($scope, err.code);
                    });
                }
            );
        }
    };

    /**
     * Drawing, Showing, Removing, Hiding POIs
     */

    $scope.drawPoisOnMapForBuilding = function () {

        var infowindow = new google.maps.InfoWindow({
            content: '-',
            maxWidth: 500
        });

        var localPuid = undefined;
        var localPoiIndex = -1;

        try {
            if (typeof(Storage) !== "undefined" && localStorage
                && !LPUtils.isNullOrUndefined(localStorage.getItem('lastBuilding'))
                && !LPUtils.isNullOrUndefined(localStorage.getItem('lastFloor'))
                && !LPUtils.isNullOrUndefined(localStorage.getItem('lastPoi'))) {

                localPuid = localStorage.getItem('lastPoi');
            }
        } catch (e) {

        }

        var entranceFound = false;
        var entrancePoi = undefined;

        var urlPuidIndex = -1;

        for (var i = 0; i < $scope.myPois.length; i++) {

            var p = $scope.myPois[i];

            if (localPuid && p.puid === localPuid) {
                localPoiIndex = i;
            }

            if ($scope.urlPuid && $scope.urlPuid == p.puid) {
                urlPuidIndex = i;
            }

            var marker;
            var htmlContent = '-';

            if (p.pois_type == "None") {
                continue;
            }

            var imgType = _getImageIconForPoi(p);
            var size = _getImageIconSizeForPoi(p);

            if ($scope.isFirefox)
                size = new google.maps.Size(62, 93);

            var scaledSize = _getImageIconSizeForPoi(p);

            marker = new google.maps.Marker({
                position: _latLngFromPoi(p),
                map: GMapService.gmap,
                draggable: false,
                icon: {
                    url: imgType,
                    size: size,
                    scaledSize: scaledSize
                },
                visible: false
            });

            htmlContent = '<div class="iw infowindow-scroll-fix">'
                + '<div class="wordwrap" style="text-align: center">'
                + '<span ng-show="navRoutesShown()" id="info-window-zoomin" ng-click="zoomInPoi()"><img src="build/images/html5_location_icon.png"></span>'
                + '<span class="iw-poi-name">' + p.name + '</span></div>'
                + '<div class="wordwrap iw-poi-description" ng-show="showPoiDescription">' + p.description + '</div>'
                + '<div style="text-align: center">'
                + '<div class="poi-action-btn"><button class="btn btn-info" ng-click="togglePoiDescription()"><i class="fa fa-info-circle"></i></i></button></div>'
                + '<div class="poi-action-btn"><button class="btn btn-primary" ng-click="startNavFromPoi()"><i style="font-size: 12px;" class="fa fa-flag"></i></button></div>'
                + '<div class="poi-action-btn"><button class="btn btn-success" ng-click="navigateFromUserToPoi(\'' + p.puid + '\')"><i class="fa fa-location-arrow"></i></button></div>'
                + '<div class="poi-action-btn"><button class="btn btn-warning" ng-click="getPoiShareUrl(\'' + p.puid + '\')"><i class="fa fa-share-alt"></i></button></div>'
                //+ '<span id="info-window-nav-from-poi" ng-click="startNavFromPoi()"><img src="build/images/start-poi-nav.png"></span>'
                //+ '<div ng-show="navRoutesShown()" class="poi-action-btn"><button class="btn btn-primary" ng-click="zoomInPoi()"><i class="fa fa-crosshairs"></i></button></div>'
                + '</div>'
                + '<div ng-show="poiShareUrl.puid" style="margin-top: 2px">'
                + '<div>Share URL:</div>'
                + '<input class="form-control" value="{{poiShareUrl.url}}" onClick="selectAllInputText(this)" readonly/>'
                + '<div>Embed:</div>'
                + '<input class="form-control" value="{{poiShareUrl.embed}}" onClick="selectAllInputText(this)" readonly/>'
                + '</div>'
                + '</div>';

            var compiledTpl = $compile(htmlContent)($scope);

            marker.tpl2 = compiledTpl[0];
            marker.model = p;

            marker.infowindow = infowindow;

            $scope.myPoisHashT[p.puid].marker = marker;

            google.maps.event.addListener(marker, 'click', function () {
                var self = this;
                $scope.$apply(function () {
                    if (self.model && self.model.puid) {

                        if ($scope.poiRouteState.from) {
                            var fpoi = $scope.poiRouteState.from;

                            $scope.retrieveRouteFromPoiToPoi(fpoi, self.model);

                            if (fpoi && fpoi.puid && $scope.myPoisHashT[fpoi.puid] && $scope.myPoisHashT[fpoi.puid].marker) {
                                self.infowindow.setContent($scope.myPoisHashT[fpoi.puid].marker.tpl2);
                                self.infowindow.open(GMapService.gmap, $scope.myPoisHashT[fpoi.puid].marker);
                            }

                            $scope.poiRouteState.from = undefined;
                            return;
                        } else {
                            $scope.poiRouteState.from = undefined;
                            if ($scope.anyService.selectedPoi && $scope.anyService.selectedPoi.puid != self.model.puid && $scope.navRoutesShown())
                                $scope.clearNavPolylines();
                        }

                        if ($scope.anyService.selectedPoi && $scope.anyService.selectedPoi.puid == self.model.puid) {
                            self.infowindow.setContent(self.tpl2);
                            self.infowindow.open(GMapService.gmap, self);
                        }
                        $scope.anyService.selectedPoi = self.model;
                    }
                })
            });

            if (entranceFound && p.is_building_entrance) {
                entrancePoi = p;
                entranceFound = true;
            }
        }

        if (urlPuidIndex >= 0) {
            $scope.anyService.selectedPoi = $scope.myPois[urlPuidIndex];
        } else if (localPoiIndex >= 0) {
            $scope.anyService.selectedPoi = $scope.myPois[localPoiIndex];
        } else if (entranceFound && entrancePoi) {
            $scope.anyService.selectedPoi = entrancePoi;
        }
        //else if ($scope.myPois && $scope.myPois.length > 0) {
        //    $scope.anyService.selectedPoi = $scope.myPois[0];
        //}

    };

    $scope.showPoisOnlyForFloor = function (floor_num) {
        for (var i = 0; i < $scope.myPois.length; i++) {
            var p = $scope.myPois[i];

            if (p && $scope.myPoisHashT[p.puid] && $scope.myPoisHashT[p.puid].marker) {
                var mrkr = $scope.myPoisHashT[p.puid].marker;

                if (p.floor_number != floor_num) {
                    mrkr.setVisible(false);
                    if (mrkr.infowindow && mrkr.infowindow.getMap()) {
                        mrkr.infowindow.setMap(null);
                    }
                } else {
                    mrkr.setVisible(true);
                }
            }
        }
    };

    $scope.removePoisOnMap = function () {
        for (var i = 0; i < $scope.myPois.length; i++) {
            var p = $scope.myPois[i];
            if (p && $scope.myPoisHashT[p.puid] && $scope.myPoisHashT[p.puid].marker) {
                $scope.myPoisHashT[p.puid].marker.setMap(null);
                delete $scope.myPoisHashT[p.puid];
            }
        }
    };

    var _hidePoisOnMap = function () {
        for (var i = 0; i < $scope.myPois.length; i++) {
            var p = $scope.myPois[i];

            if ($scope.anyService.selectedPoi && p.puid == $scope.anyService.selectedPoi.puid)
                continue;

            if (p && $scope.myPoisHashT[p.puid] && $scope.myPoisHashT[p.puid].marker) {
                var mrkr = $scope.myPoisHashT[p.puid].marker;
                mrkr.setVisible(false);
            }
        }
    };

    var _makeVisiblePoisOnMap = function () {
        for (var i = 0; i < $scope.myPois.length; i++) {
            var p = $scope.myPois[i];
            if (p.floor_number != $scope.anyService.getFloorNumber())
                continue;
            if (p && $scope.myPoisHashT[p.puid] && $scope.myPoisHashT[p.puid].marker) {
                var mrkr = $scope.myPoisHashT[p.puid].marker;
                mrkr.setVisible(true);
            }
        }
    };

    var _isPointInSelectedFloor = function (x, y) {
        var f = $scope.anyService.selectedFloor;
        if (!f)
            return false;

        var bllat = parseFloat(f.bottom_left_lat);
        var bllng = parseFloat(f.bottom_left_lng);

        var trlat = parseFloat(f.top_right_lat);
        var trlng = parseFloat(f.top_right_lng);

        var radius = _euclideanDistance(bllat, bllng, trlat, trlng) / 2;

        var centre_x = (bllat + trlat) / 2;
        var centre_y = (bllng + trlng) / 2;

        var resd = _euclideanDistance(centre_x, centre_y, x, y);
        return (resd <= radius)
    }
}
])
;
