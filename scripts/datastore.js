(function (window) {
  'use strict';
  var App = window.App || {};

  function DataStore() {
    this.data = {
      waterData: {
        realtimeData: new Map(),
        summaryData: new Map()
      },
      weatherData: {}
    };
  }

  DataStore.prototype.getWaterData = function(realtimeCallback, summaryCallback) {
    let realtimeRequest = 'https://io.ekmpush.com/readMeter?key=NjUyNDQ0Njc6Y2E5b0hRVGc&meters=350002883~350002885&ver=v4&fmt=json&cnt=720&fields=Pulse_Cnt_1~Pulse_Cnt_2~Pulse_Cnt_3';
    this.callApi(realtimeRequest, function(apiResponse) {
      this.processRealtimeWaterData(apiResponse);
      realtimeCallback();
      let summaryRequest = "https://summary.ekmpush.com/summary?meters=350002883~350002885&key=NjUyNDQ0Njc6Y2E5b0hRVGc&ver=v4&format=json&report=dy&limit=60&fields=Pulse_Cnt*&bulk=1&normalize=1";
      this.callApi(summaryRequest, function(apiResponse) {
        this.processSummaryWaterData(apiResponse);
        summaryCallback();
      }.bind(this));
    }.bind(this));
  };

  DataStore.prototype.getWeatherData = function(callback) {
    var request = 'https://api.openweathermap.org/data/2.5/onecall?lat=36.974800&lon=-122.031970&units=imperial&exclude=minutely,hourly,daily&appid=4530c5f0704984be70de48b60f3ecd42';
    this.callApi(request, function(apiObject) {
      this.data.weatherData = JSON.parse(apiObject);
      callback();
    }.bind(this));
  };

  DataStore.prototype.getRealtimeDataForMeter = function(meter) {
    return this.data.waterData.realtimeData.get(meter);
  };

  DataStore.prototype.getSummaryDataForMeter = function(meter) {
    return this.data.waterData.summaryData.get(meter);
  };

  // This code accesses the apiRequest URL and converts
  // the contents to a usable JSON object named apiObject
  DataStore.prototype.callApi = function(apiRequest,callback) {
      var xhttp = new XMLHttpRequest();

      xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
          //var jsonObject = JSON.parse(xhttp.responseText);
          callback(xhttp.responseText);
        }
      };
      xhttp.open("GET", apiRequest, true);
      xhttp.send();
  }

  DataStore.prototype.processRealtimeWaterData = function(rawResponse) {
    let serverData = JSON.parse(rawResponse);
    this.data.waterData.realtimeData = new Map();

    let readSets = serverData.readMeter.ReadSet;
    if (!readSets) { return; }

    // Copy all readings to meter-indexed map
    // Exclude any data points with 0 pulse
    for (let i = 0; i < readSets.length; i++) {
      const meterId = readSets[i].Meter.toString();
      if (!this.data.waterData.realtimeData.has(meterId)) {
        this.data.waterData.realtimeData.set(meterId, []);
      }
      let setData = readSets[i].ReadData;
      for (let j = setData.length - 1; j >= 0; j--) {
        if (setData[j].Pulse_Cnt_1 == 0 && setData[j].Pulse_Cnt_2 == 0 &&
          setData[j].Pulse_Cnt_3 == 0) {
            console.log("Removing all-0 pulse count data point at [" + i + "][" + j + "]");
            //setData.splice(j, 1);
          } else {
            this.data.waterData.realtimeData.get(meterId).push(setData[j]);
          }
        }
    }

    // Sort all data by ascending time
    for (let [key, points] of this.data.waterData.realtimeData) {
      points.sort(function(a,b) {
        return (a.End_Time_Stamp_UTC_ms - b.End_Time_Stamp_UTC_ms)
      });
    }

    // Add fields for delta pulses and gallons/cu ft
    for (let [key, points] of this.data.waterData.realtimeData) {
      for (let i = 0; i < points.length; i++) {
        points[i].Pulse_Cnt_1_Diff = i > 0 ?
        points[i].Pulse_Cnt_1 - points[i-1].Pulse_Cnt_1 : 0;
        points[i].Pulse_Cnt_2_Diff = i > 0 ?
        points[i].Pulse_Cnt_2 - points[i-1].Pulse_Cnt_2 : 0;
        points[i].Pulse_Cnt_3_Diff = i > 0 ?
        points[i].Pulse_Cnt_3 - points[i-1].Pulse_Cnt_3 : 0;
        points[i].Volume_1 = getVolumeFromPulseCount(points[i].Pulse_Cnt_1);
        points[i].Volume_2 = getVolumeFromPulseCount(points[i].Pulse_Cnt_2);
        points[i].Volume_3 = getVolumeFromPulseCount(points[i].Pulse_Cnt_3);
        points[i].Volume_1_Diff = getVolumeFromPulseCount(points[i].Pulse_Cnt_1_Diff);
        points[i].Volume_2_Diff = getVolumeFromPulseCount(points[i].Pulse_Cnt_2_Diff);
        points[i].Volume_3_Diff = getVolumeFromPulseCount(points[i].Pulse_Cnt_3_Diff);
      }
    }
  };

  DataStore.prototype.processSummaryWaterData = function(rawResponse) {
     let serverData = JSON.parse(rawResponse);
     this.data.waterData.summaryData = new Map();
     for (let i = 0; i < serverData.length; i++) {
       const meterId = serverData[i].Meter.toString();
       if (!this.data.waterData.summaryData.has(meterId)) {
         this.data.waterData.summaryData.set(meterId, []);
       }
       this.data.waterData.summaryData.get(meterId).push(serverData[i]);
     }

     // Sort all data by ascending time
     for (let [key, points] of this.data.waterData.summaryData) {
       points.sort(function(a,b) {
         return (a.End_Time_Stamp_UTC_ms - b.End_Time_Stamp_UTC_ms)
       });
     }
  };

   function getVolumeFromPulseCount(pulseCount) {
      return pulseCount * 0.748052;
  }

  App.DataStore = DataStore;
  window.App = App;
})(window);
