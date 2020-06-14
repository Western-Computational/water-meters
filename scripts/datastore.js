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
      let summaryRequest = "https://summary.ekmpush.com/summary?meters=350002883~350002885&key=NjUyNDQ0Njc6Y2E5b0hRVGc&ver=v4&format=json&report=dy&limit=60&fields=Pulse_Cnt*&bulk=1&normalize=1&timezone=America~Los_Angeles";
      this.callApi(summaryRequest, function(apiResponse) {
        this.processSummaryWaterData(apiResponse);
        summaryCallback();
      }.bind(this));
    }.bind(this));
  };

  DataStore.prototype.updateWaterData = function(realtimeCallback, summaryCallback) {
    const lastRealtimeEntry1 = this.lastRealtimeEntryForMeter("350002883");
    const lastRealtimeEntry2 = this.lastRealtimeEntryForMeter("350002885");
    let timestamp1 = lastRealtimeEntry1['Time_Stamp_UTC_ms'] || 0;
    let timestamp2 = lastRealtimeEntry2['Time_Stamp_UTC_ms'] || 0;
    // Get the earliest of the last timestamps to request updates
    let lastTimestamp = timestamp1 < timestamp2 ? timestamp1 : timestamp2;
    let sinceClause = lastTimestamp > 0 ? "&since=" + lastTimestamp.toString() : "";
    let realtimeRequest = 'https://io.ekmpush.com/readMeter?key=NjUyNDQ0Njc6Y2E5b0hRVGc&meters=350002883~350002885&ver=v4&fmt=json&cnt=720&fields=Pulse_Cnt_1~Pulse_Cnt_2~Pulse_Cnt_3' +
      sinceClause;
    this.callApi(realtimeRequest, function(apiResponse) {
      this.processRealtimeWaterUpdate(apiResponse);
      realtimeCallback();
      //this.data.waterData.summaryData.get("350002883").pop();
      //this.data.waterData.summaryData.get("350002885").pop();
      const lastSummaryEntry1 = this.lastSummaryEntryForMeter("350002883");
      const lastSummaryEntry2 = this.lastSummaryEntryForMeter("350002885");
      let timestamp1 = lastSummaryEntry1['End_Time_Stamp_UTC_ms'] || 0;
      let timestamp2 = lastSummaryEntry2['End_Time_Stamp_UTC_ms'] || 0;
      // Get the earliest of the last timestamps to request updates
      let lastTimestamp = timestamp1 < timestamp2 ? timestamp1 : timestamp2;
      let updateAvailable = true;
      let sinceClause = "";
      if (lastTimestamp > 0) {
        let startDateStr = dateStringFromTimestamp(lastTimestamp);
        let endDateStr = dateStringFromTimestamp(endOfDayTimestmap());
        sinceClause = "&start_date=" + startDateStr + "&end_date=" + endDateStr;
        updateAvailable = startDateStr !== endDateStr;
      }
      if (updateAvailable) {
        let summaryRequest = "https://summary.ekmpush.com/summary?meters=350002883~350002885&key=NjUyNDQ0Njc6Y2E5b0hRVGc&ver=v4&format=json&report=dy&limit=60&fields=Pulse_Cnt*&bulk=1&normalize=1&timezone=America~Los_Angeles" +
          sinceClause;
          this.callApi(summaryRequest, function(apiResponse) {
            this.processSummaryWaterData(apiResponse);
            summaryCallback();
          }.bind(this));
      } else {
        summaryCallback();  // let caller update on existing data if they want
      }
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

  DataStore.prototype.lastRealtimeEntryForMeter = function(meter) {
    const entries = this.data.waterData.realtimeData.get(meter);
    if (entries && entries.length > 0) {
      return entries[entries.length-1];
    }
    return null;
  };

  DataStore.prototype.lastSummaryEntryForMeter = function(meter) {
    const entries = this.data.waterData.summaryData.get(meter);
    if (entries && entries.length > 0) {
      return entries[entries.length-1];
    }
    return null;
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
        return (a.Time_Stamp_UTC_ms - b.Time_Stamp_UTC_ms)
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

  DataStore.prototype.processRealtimeWaterUpdate = function(rawResponse) {
    let serverData = JSON.parse(rawResponse);
    let readSets = serverData.readMeter.ReadSet;
    if (!readSets) { return; }

    // Copy all readings to meter-indexed map
    for (let i = 0; i < readSets.length; i++) {
      const meterId = readSets[i].Meter.toString();
      if (!this.data.waterData.realtimeData.has(meterId)) {
        this.data.waterData.realtimeData.set(meterId, []);
      }

      // Sort new data by ascending time
      let points = readSets[i].ReadData;
      points.sort(function(a,b) {
        return (a.Time_Stamp_UTC_ms - b.Time_Stamp_UTC_ms)
      });

      // Add fields for delta pulses and gallons/cu ft
      let meterData = this.data.waterData.realtimeData.get(meterId);
      let lastPoint = meterData.length > 0 ? meterData[meterData.length - 1] : null;

      for (let j = 0; j < points.length; j++) {
        // Exclude any data points with 0 pulse
        let point = points[j];
        if (point.Pulse_Cnt_1 == 0 && point.Pulse_Cnt_2 == 0 && point.Pulse_Cnt_3 == 0) {
          console.log("Removing all-0 pulse count data point at [" + i + "][" + j + "]");
        } else if (lastPoint && point.Time_Stamp_UTC_ms <= lastPoint.Time_Stamp_UTC_ms) {
          console.log("Skipping old/duplicate point at [" + i + "][" + j + "]");
        } else {
          point.Pulse_Cnt_1_Diff = lastPoint != null ?
            point.Pulse_Cnt_1 - lastPoint.Pulse_Cnt_1 : 0;
          point.Pulse_Cnt_2_Diff = lastPoint != null ?
            point.Pulse_Cnt_2 - lastPoint.Pulse_Cnt_2 : 0;
          point.Pulse_Cnt_3_Diff = lastPoint != null ?
            point.Pulse_Cnt_3 - lastPoint.Pulse_Cnt_3 : 0;
          point.Volume_1 = getVolumeFromPulseCount(point.Pulse_Cnt_1);
          point.Volume_2 = getVolumeFromPulseCount(point.Pulse_Cnt_2);
          point.Volume_3 = getVolumeFromPulseCount(point.Pulse_Cnt_3);
          point.Volume_1_Diff = getVolumeFromPulseCount(point.Pulse_Cnt_1_Diff);
          point.Volume_2_Diff = getVolumeFromPulseCount(point.Pulse_Cnt_2_Diff);
          point.Volume_3_Diff = getVolumeFromPulseCount(point.Pulse_Cnt_3_Diff);
          meterData.push(point);
          lastPoint = point;
        }
      }
    }
  };

  DataStore.prototype.processSummaryWaterData = function(rawResponse) {
     let serverData = JSON.parse(rawResponse);
     this.data.waterData.summaryData = new Map();

     // Sort all data by ascending time
     serverData.sort(function(a,b) {
       return (a.End_Time_Stamp_UTC_ms - b.End_Time_Stamp_UTC_ms)
     });

     for (let i = 0; i < serverData.length; i++) {
       const meterId = serverData[i].Meter.toString();
       if (!this.data.waterData.summaryData.has(meterId)) {
         this.data.waterData.summaryData.set(meterId, []);
       }
       const point = serverData[i];
       const meterData = this.data.waterData.summaryData.get(meterId);
       const lastPoint = meterData.length > 0 ? meterData[meterData.length - 1] : null;
       if (lastPoint && point.Time_Stamp_UTC_ms <= lastPoint.Time_Stamp_UTC_ms) {
         console.log("Skipping old/duplicate summary point at index [" + i + "]");
       } else {
         meterData.push(point);
       }
     }
  };

   function getVolumeFromPulseCount(pulseCount) {
      return pulseCount * 0.748052;
  }

  function dateStringFromTimestamp(timestamp) {
    let d = new Date(timestamp);
    let year = d.getFullYear().toString();
    let month = ("0" + (d.getMonth() + 1)).slice(-2);
    let date = ("0" + d.getDate()).slice(-2);
    let hours = ("0" + d.getHours()).slice(-2);
    let minutes = ("0" + d.getMinutes()).slice(-2);
    return year + month + date + hours + minutes;
  }

  function endOfDayTimestmap() {
    let d = new Date();
    d.setHours(23,59,59,999);
    return d.getTime();
  }

  App.DataStore = DataStore;
  window.App = App;
})(window);
