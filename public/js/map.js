if (typeof mapToken !== "undefined" && mapToken && document.getElementById("map")) {
  mapboxgl.accessToken = mapToken;

  const defaultCoords = [77.2090, 28.6139];
  const coordinates = (typeof listing !== "undefined" && listing.geometry && listing.geometry.coordinates && listing.geometry.coordinates.length === 2)
    ? listing.geometry.coordinates
    : defaultCoords;

  const locationText = (typeof listing !== "undefined" && listing.location) ? listing.location : "Exact Location";

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: coordinates,
    zoom: 9,
    attributionControl: false,
  });

  const marker1 = new mapboxgl.Marker({ color: "#fe424d" })
    .setLngLat(coordinates)
    .setPopup(
      new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<h4>${locationText}</h4><p>Exact location will be provided after booking</p>`
      )
    )
    .addTo(map);

  map.addControl(new mapboxgl.FullscreenControl());
  map.addControl(new mapboxgl.NavigationControl());

  map.flyTo({
    center: coordinates,
    zoom: 11,
    speed: 1.2,
    curve: 1.42,
    easing(t) {
      return t;
    },
  });

  // Pulsing Dot animation
  const size = 200;
  const pulsingDot = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),

    onAdd: function () {
      const canvas = document.createElement("canvas");
      canvas.width = this.width;
      canvas.height = this.height;
      this.context = canvas.getContext("2d");
    },

    render: function () {
      const duration = 1000;
      const t = (performance.now() % duration) / duration;

      const radius = (size / 2) * 0.3;
      const outerRadius = (size / 2) * 0.7 * t + radius;
      const context = this.context;

      context.clearRect(0, 0, this.width, this.height);
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 200, 200, ${1 - t})`;
      context.fill();

      context.beginPath();
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
      context.fillStyle = "rgba(254, 66, 77, 1)";
      context.strokeStyle = "white";
      context.lineWidth = 2 + 4 * (1 - t);
      context.fill();
      context.stroke();

      this.data = context.getImageData(0, 0, this.width, this.height).data;
      map.triggerRepaint();
      return true;
    },
  };

  map.on("load", () => {
    map.addImage("pulsing-dot", pulsingDot, { pixelRatio: 2 });

    map.addSource("dot-point", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: coordinates,
            },
          },
        ],
      },
    });
    map.addLayer({
      id: "layer-with-pulsing-dot",
      type: "symbol",
      source: "dot-point",
      layout: {
        "icon-image": "pulsing-dot",
      },
    });
  });
}
