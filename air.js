(function() {
    "use strict";
    let map, airports = [], markers = [], airport1, airport2;
    
    function initializeMap() {
        const continentalUS = new google.maps.LatLngBounds(
            new google.maps.LatLng(25, -123),
            new google.maps.LatLng(49, -67)
        );

        map = new google.maps.Map($("#map")[0]);
        map.fitBounds(continentalUS);
        $.getJSON("data.json").done(renderAirports);
    }

    function initializeAutocomplete() {
        let list = [];
        for (let airport of airports) {
            list.push({
                label: `${airport.iata} — ${airport.city}, ${airport.name}`,
                value: airport.iata
            });
        }
        new Awesomplete($("#airport1")[0], {list});
        new Awesomplete($("#airport2")[0], {list});
        Awesomplete.$.bind($("#airport1")[0], {"awesomplete-selectcomplete": inputFieldsChange});
        Awesomplete.$.bind($("#airport2")[0], {"awesomplete-selectcomplete": inputFieldsChange});
    }

    function renderAirports(data) {
        const icon = {
                small: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: "red",
                    fillOpacity: 0.6,
                    scale: 3,
                    strokeWeight: 1
                },
                big: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: "green",
                    fillOpacity: 1,
                    scale: 4,
                    strokeWeight: 2
                }
            };
        
        airports = data;
        airports.forEach(airport => {
            let marker = new google.maps.Marker({
                map,
                position: new google.maps.LatLng(airport.lat, airport.lng),                
                icon: icon[airport.size],
                title: `${airport.city}, ${airport.state} — ${airport.name} (${airport.iata})`
            });
            marker.addListener("click", () => selectAirport(airport));
            markers.push(marker);
        });

        initializeAutocomplete();
    }

    function getAirportByIATA(iata) {
        if (iata.length !== 3) {
            return null;
        }

        for (let airport of airports) {
            if (airport.iata === iata) {
                return airport;
            }
        }
        return null;
    }

    function inputFieldsChange(event) {
        let text = event.target.value.toUpperCase(),
            airport = getAirportByIATA(text);
        if (airport) {
            selectAirport(airport, event.target.id === "airport1");
        }
    }

    function selectAirport(airport, fromAirport = true) {
        let marker = new google.maps.Marker({
                map,
                position: new google.maps.LatLng(airport.lat, airport.lng),
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: "gold",
                    fillOpacity: 1,
                    scale: 9,
                    strokeWeight: 2
                },
            });

        if (!airport1 && fromAirport) {
            airport1 = airport;
            $("#airport1").val(airport.iata)
        } else if (!fromAirport || airport.iata !== airport1.iata) {
            airport2 = airport;
            $("#airport2").val(airport.iata)
        }

        if (airport1 && airport2) {
            showFlightRoute();
        }
    }

    function hideMarkers() {
        for (let marker of markers) {
            marker.setMap(null);
        }
    }

    function showFlightRoute() {
        const miles = 0.621371;
        const nauticalMiles = 0.539956;
        let airport1LatLng = new google.maps.LatLng(airport1.lat, airport1.lng),
            airport2LatLng = new google.maps.LatLng(airport2.lat, airport2.lng),
            distance = google.maps.geometry.spherical.computeDistanceBetween(airport1LatLng, airport2LatLng),
            distanceStr = (distance*miles/1000).toLocaleString("en-US", {maximumFractionDigits: 0}),
            distanceNauStr = (distance*nauticalMiles/1000).toLocaleString("en-US", {maximumFractionDigits: 0}),
            routeBounds = new google.maps.LatLngBounds(),
            geodesicLine = new google.maps.Polyline({
                map,
                strokeColor: "red",
                strokeWeight: 4,
                geodesic: true,
                path: [airport1LatLng, airport2LatLng],
            });

        hideMarkers();
        routeBounds.extend(airport1LatLng);
        routeBounds.extend(airport2LatLng);
        map.fitBounds(routeBounds);

        $("#inputs").hide();
        $("#distance").text(`Distance between ${airport1.city} (${airport1.iata}) and ${airport2.city} (${airport2.iata})
            is ${distanceStr} mi or ${distanceNauStr} nmi`)
    }

    google.maps.event.addDomListener(window, "load", initializeMap);
    $("#inputs input").on("change paste keyup", inputFieldsChange);
})();
