var StratApp = angular.module("strat-map",["ngRoute", "colorpicker.module"]);

StratApp.config(["$routeProvider", "$compileProvider", function($routeProvider, $compileProvider) {
    $routeProvider.when("/", {
	templateUrl: "assets/template/main.html",
	controller: "StratController"
    });

    $routeProvider.when("/about", {
	templateUrl:"assets/template/about.html"
    });

    $routeProvider.otherwise("/");

    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data):/);
}]);


StratApp.controller("StratController", ["$scope", "$http", function($scope, $http) {
    $scope.maps = [],
    $scope.currentMap = "",
    $scope.mapOptions = [],
    $scope.nades = [],
    $scope.pencil = {},
    $scope.players = {},
    $scope.images = {},
    $scope.downloadDataUrl = "",
    $scope.hasDataUrl = false,
    $scope.strategyTitle = "",
    $scope.strategyDescription = "";

    ["he", "decoy", "flash", "molotov", "smoke"].forEach(function(name) {
	$scope.images[name] = new Image();
	$scope.images[name].src = "assets/img/" + name + ".png";
    });

    $http.get("data/maps.json").success(function(data, status) {
	$scope.maps = data;
	$scope.mapOptions = $scope.maps.map(function(map) {
	    return map.displayName;
	});
    }).error(function(data, status) { });

    $http.get("data/players.json").success(function(data, status) {
	$scope.players = data;
    }).error(function() { });

    $http.get("data/nades.json").success(function(data, status) {
	$scope.nades = data;
    });

    $scope.setPencil = function(name) {
	if (name.match(/player[1-5]/) !== null) {
	    $scope.pencil.type = "fa-user";
	    $scope.pencil.name = "player";
	    $scope.pencil.displayName = $scope.players[name].name;
	    $scope.pencil.color = $scope.players[name].color;
	    if ($scope.pencil.displayName === ""){
		$scope.pencil.displayName = "Player";
	    }

	} else if (name.match(/(decoy|flash|he|smoke|molotov)/)){
	    $scope.pencil.name = name,
	    $scope.pencil.displayName = $scope.nades[name].displayName;
	    $scope.pencil.color = "#000";
	    $scope.pencil.type = "grenade";
	}
    };

    $scope.download = function() {
	$scope.hasDataUrl = true;
	$scope.downloadDataUrl = document.querySelector("#map").toDataURL();
    };

    $scope.removeDataUrl = function() {
	$scope.hasDataUrl = false;
	$scope.downloadDataUrl = "";
    };
}]);

StratApp.directive("overlay", function() {
    return {
	restrict: "A",
	scope: {
	    ngModel: "="
	},
	link: function($scope, $element) {
	    var overlayCanvas = $element[0],
		mapCanvas = $element.prev()[0],
		overlayContext = overlayCanvas.getContext("2d"),
		mapContext = mapCanvas.getContext("2d"),
		dimension = $element.parent().width();
	    overlayCanvas.setAttribute('width',dimension);
	    overlayCanvas.setAttribute('height',dimension);

	    var drawing = false;

	    overlayContext.lineWidth = 1,
	    overlayContext.lineJoin = "miter",
	    overlayContext.lineCap = "miter",
	    overlayContext.strokeStyle = "#eee",
	    overlayContext.fillStyle = "#eee";

	    var overlayOffset = $(overlayCanvas).offset(),
		mapOffset = $(mapCanvas).offset(),
		overlayOffsetX = overlayOffset.left,
		overlayOffsetY = overlayOffset.top,
		mapOffsetX = mapOffset.left,
		mapOffsetY = mapOffset.top;

	    var mouseXOld = overlayOffsetX,
		mouseYOld = overlayOffsetY;

	    $element.mousedown(function(event) {
		drawing = true;
		mouseXOld = event.pageX - overlayOffsetX,
		mouseYOld = event.pageY - overlayOffsetY;
	    });

	    $element.mouseup(function(event) {
		drawing = false;
	    });

	    $element.mouseout(function(event) {
		drawing = false;
		overlayContext.clearRect(0,0,dimension,dimension);
	    });

	    $element.mousemove(function(event) {

		var mouseX=parseInt(event.pageX - overlayOffsetX),
		    mouseY=parseInt(event.pageY - overlayOffsetY);


		overlayContext.clearRect(0,0,dimension,dimension);

		if ($scope.$parent.pencil.type === "grenade") {

		    event.preventDefault();
		    event.stopPropagation();


		    if (typeof $scope.ngModel.name !== "undefined") {
			overlayContext.drawImage($scope.$parent.images[$scope.ngModel.name], mouseX-15, mouseY-25, 30, 50);
			return;
		    }
		} else if ($scope.$parent.pencil.type === "fa-user" || typeof $scope.$parent.pencil.type === "undefined") {

		    if($scope.$parent.pencil.type === "fa-user") {

			mapContext.lineWidth = 3,
			mapContext.strokeStyle = $scope.$parent.pencil.color,
			mapContext.fillStyle = $scope.$parent.pencil.color;

			overlayContext.strokeStyle = $scope.$parent.pencil.color,
			overlayContext.fillStyle = $scope.$parent.pencil.color;

			overlayContext.font = "8px sans-serif";
			overlayContext.fillText($scope.$parent.pencil.displayName || $scope.$parent.pencil.name, mouseX+2, mouseY+9);

			if (drawing) {
			    mapContext.beginPath();
			    mapContext.moveTo(mouseXOld, mouseYOld);
			    mapContext.lineTo(mouseX, mouseY);
			    mapContext.stroke();

			    mouseXOld = mouseX,
			    mouseYOld = mouseY;
			}
		    }

		    overlayContext.beginPath();
		    overlayContext.moveTo(mouseX-10, mouseY);
		    overlayContext.lineTo(mouseX+10, mouseY);
		    overlayContext.moveTo(mouseX, mouseY-10);
		    overlayContext.lineTo(mouseX, mouseY+10);
		    overlayContext.stroke();

		    return;
		}
	    });

	    $element.click(function(event) {

		if (typeof $scope.$parent.pencil === "undefined" ||
		    typeof $scope.$parent.pencil.type === "undefined") {
		    return;
		}

		var overlayOffset = $(overlayCanvas).offset(),
		    mapOffset = $(mapCanvas).offset(),
		    overlayOffsetX = overlayOffset.left,
		    overlayOffsetY = overlayOffset.top,
		    mapOffsetX = mapOffset.left,
		    mapOffsetY = mapOffset.top;

		if ( $scope.$parent.pencil.type === "grenade") {
		    var mouseX=parseInt(event.pageX - mapOffsetX),
			mouseY=parseInt(event.pageY - mapOffsetY);
		    mapContext.drawImage($scope.$parent.images[$scope.$parent.pencil.name],
					 mouseX-15, mouseY-25, 30, 50);
		}
	    });


	}
    };
});

StratApp.directive("map", function() {
    return {
	restrict: "A",
	scope: {
	    "mapOverlay": "=",
	    "mapMaps": "="
	},
	link: function($scope, $element){
	    var canvas = $element[0],
		dimension = $element.parent().width();

	    canvas.setAttribute('width',dimension);
	    canvas.setAttribute('height',dimension);

	    var offset = $(canvas).offset(),
		offsetX = offset.left,
		offsetY = offset.top;


	    var context = canvas.getContext("2d");

	    $scope.$watch("mapOverlay", function(mapValue) {
		if (mapValue === "") {
		    return ;
		}
		var mapObject = $scope.mapMaps.filter(function(map) {
		    return map.displayName === mapValue;
		})[0];

		drawMap(mapObject.imagePath);
	    });

	    var drawNade = false;

	    function drawMap (imagePath) {

		var mapImage = new Image();
		mapImage.src = imagePath;

		mapImage.onload = function() {
		    context.clearRect(0,0,dimension, dimension);
		    context.save();
		    context.globalAlpha = 0.75;
		    context.drawImage(mapImage, 0, 0, dimension, dimension);
		    context.restore();
		};
	    };
	}
    };
});

StratApp.directive("pencil", function() {
    return {
	restrict: 'E',
	scope: {
	    ngModel: "="
	},
	templateUrl: "assets/template/pencil.html"
    };
});
