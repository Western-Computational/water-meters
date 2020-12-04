(function (window) {
  'use strict';
  var App = window.App || {};

  function Settings() {
    this.units = new Map();
    this.charts = new Map();
    this.initialize();
  }

  Settings.prototype.initialize = function() {
    this.meters = ["350002883", "350002885"];
    this.units = new Map([
      ["301", { meterId: "350002883", pulse: 1 }],
      ["303", { meterId: "350002883", pulse: 2 }],
      ["305", { meterId: "350002883", pulse: 3 }],
      ["307", { meterId: "350002885", pulse: 1 }],
      ["Garden", { meterId: "350002885", pulse: 2}]
    ]);

    this.charts = new Map([
      [ "chartdiv1", { meter: "350002885", pulse: 2, mode: "minutes" } ],
      [ "chartdiv2", { meter: "350002883", pulse: 1, mode: "minutes" } ],
      [ "chartdiv3", { meter: "350002883", pulse: 2, mode: "minutes" } ],
      [ "chartdiv4", { meter: "350002883", pulse: 3, mode: "minutes" } ],
      [ "chartdiv5", { meter: "350002885", pulse: 1, mode: "minutes" } ],
      [ "chartdiv6", { meter: "*", pulse: 0, mode: "portions" } ]
    ]);
  }

  App.Settings = Settings;
  window.App = App;
})(window);
