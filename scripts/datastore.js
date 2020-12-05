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

  DataStore.prototype.updateWaterData = function(realtimeCallback, summaryCallback) {
    const lastRealtimeEntry1 = this.lastRealtimeEntryForMeter("350002883");
    const lastRealtimeEntry2 = this.lastRealtimeEntryForMeter("350002885");
    let timestamp1 = (lastRealtimeEntry1 && lastRealtimeEntry1['Time_Stamp_UTC_ms']) || 0;
    let timestamp2 = (lastRealtimeEntry2 && lastRealtimeEntry2['Time_Stamp_UTC_ms']) || 0;
    // Get the earliest of the last timestamps to request updates
    let lastTimestamp = timestamp1 < timestamp2 ? timestamp1 : timestamp2;
    let sinceClause = lastTimestamp > 0 ? "&since=" + lastTimestamp.toString() : "";
    let realtimeRequest = 'https://io.ekmpush.com/readMeter?key=NjUyNDQ0Njc6Y2E5b0hRVGc&meters=350002883~350002885&ver=v4&fmt=json&cnt=720&fields=Pulse_Cnt_1~Pulse_Cnt_2~Pulse_Cnt_3' +
      sinceClause;
    this.callApi(realtimeRequest, function(apiResponse) {
      this.processRealtimeWaterData(apiResponse);
      realtimeCallback();
      /*
      // For testing incremental updates to summary data:
      if (this.lastSummaryEntryForMeter("350002883")) {
        this.data.waterData.summaryData.get("350002883").pop();
      }
      if (this.lastSummaryEntryForMeter("350002885")) {
        this.data.waterData.summaryData.get("350002885").pop();
      }
      */
      const lastSummaryEntry1 = this.lastSummaryEntryForMeter("350002883");
      const lastSummaryEntry2 = this.lastSummaryEntryForMeter("350002885");
      let timestamp1 = (lastSummaryEntry1 && lastSummaryEntry1['End_Time_Stamp_UTC_ms']) || 0;
      let timestamp2 = (lastSummaryEntry2 && lastSummaryEntry2['End_Time_Stamp_UTC_ms']) || 0;
      // Get the earliest of the last timestamps to request updates
      let lastTimestamp = timestamp1 < timestamp2 ? timestamp1 : timestamp2;
      let updateAvailable = true;
      let sinceClause = "";
      if (lastTimestamp > 0) {
        let startDateStr = dateStringFromTimestamp(lastTimestamp);
        let endDateStr = dateStringFromTimestamp(endOfDayTimestamp());
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

  DataStore.prototype.updateWeatherData = function(callback) {
    //var request = 'https://api.openweathermap.org/data/2.5/onecall?lat=36.974800&lon=-122.031970&units=imperial&exclude=minutely,hourly,daily&appid=4530c5f0704984be70de48b60f3ecd42';
    var request = 'https://api.weather.com/v2/pws/observations/current?stationId=KCASANTA3431&format=json&units=e&apiKey=0e45a9b492184b6085a9b492185b6090&numericPrecision=decimal'
    this.callApi(request, function(apiObject) {
      this.data.weatherData = JSON.parse(apiObject);
      callback();
    }.bind(this));
  };

  DataStore.prototype.getRealtimeDataTimestamp = function() {
    return this.data.waterData.realtimeData.timestamp;
  };

  DataStore.prototype.getRealtimeDataForMeter = function(meterId) {
    return this.data.waterData.realtimeData.get(meterId);
  };

  DataStore.prototype.getRealtimeEntriesForMeter = function(meterId) {
    const data = this.getRealtimeDataForMeter(meterId);
    return (data && data.entries) || null;
  };

  DataStore.prototype.getSummaryDataTimestamp = function() {
    return this.data.waterData.summaryData.timestamp;
  };

  DataStore.prototype.getSummaryDataForMeter = function(meterId) {
    return this.data.waterData.summaryData.get(meterId);
  };

  DataStore.prototype.getSummaryEntriesForMeter = function(meterId) {
    const data = this.getSummaryDataForMeter(meterId);
    return (data && data.entries) || null;
  };

  DataStore.prototype.getSummaryRangeForMeter = function(meterId, startDate, endDate) {
    const data = this.getSummaryDataForMeter(meterId);
    if (data && data.entries &&
        DataStore.isValidDate(startDate) && DataStore.isValidDate(endDate)) {
      let rangeEntries = [];
      const start = beginningOfDayTimestamp(startDate);
      const end = endOfDayTimestamp(endDate);
      for (let i = 0; i < data.entries.length; i++) {
        const point = data.entries[i];
        if (point.End_Time_Stamp_UTC_ms > end) {
          break;
        } else if (point.Start_Time_Stamp_UTC_ms >= start) {
          rangeEntries.push(point);
        }
      }
      return rangeEntries;
    }
    return null;
  };

  DataStore.prototype.lastRealtimeEntryForMeter = function(meter) {
    const entries = this.getRealtimeEntriesForMeter(meter);
    if (entries && entries.length > 0) {
      return entries[entries.length-1];
    }
    return null;
  };

  DataStore.prototype.firstSummaryEntryForMeter = function(meter) {
    const entries = this.getSummaryEntriesForMeter(meter);
    if (entries && entries.length > 0) {
      return entries[0];
    }
    return null;
  };

  DataStore.prototype.lastSummaryEntryForMeter = function(meter) {
    const entries = this.getSummaryEntriesForMeter(meter);
    if (entries && entries.length > 0) {
      return entries[entries.length-1];
    }
    return null;
  };

  DataStore.prototype.earliestSummaryTimestamp = function() {
    let ts;
    for (let [meterId, data] of this.data.waterData.summaryData) {
      const firstEntry = this.firstSummaryEntryForMeter(meterId);
      if (!ts || firstEntry.End_Time_Stamp_UTC_ms < ts) {
        ts = firstEntry.End_Time_Stamp_UTC_ms;
      }
    }
    return ts;
  };

  DataStore.prototype.latestSummaryTimestamp = function() {
    let ts;
    for (let [meterId, data] of this.data.waterData.summaryData) {
      const lastEntry = this.lastSummaryEntryForMeter(meterId);
      if (!ts || lastEntry.End_Time_Stamp_UTC_ms > ts) {
        ts = lastEntry.End_Time_Stamp_UTC_ms;
      }
    }
    return ts;
  };

  DataStore.prototype.summaryTotalForMeterField = function(meterId, dataField, startDate, endDate) {
    let total = 0;
    if (meterId && dataField) {
      const data = DataStore.isValidDate(startDate) && DataStore.isValidDate(endDate) ?
        this.getSummaryRangeForMeter(meterId, startDate, endDate) : this.getSummaryEntriesForMeter(meterId);
      for (let i = 0; i < data.length; i++) {
        total += (data[i][dataField] || 0);
      }
    }
    return total;
  };

  DataStore.prototype.getRealtimeWeatherData = function() {
    if (this.data.weatherData.observations && this.data.weatherData.observations.length > 0) {
      var realtimeData = this.data.weatherData.observations[0];
      if (realtimeData.stationID) {
        realtimeData.stationURL = "https://www.wunderground.com/dashboard/pws/" + realtimeData.stationID;
      }
      return realtimeData;
    }
    return {};
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
    let readSets = serverData.readMeter.ReadSet;
    if (!readSets) { return; }

    this.data.waterData.realtimeData.timestamp = new Date();

    // Copy all readings to meter-indexed map
    for (let i = 0; i < readSets.length; i++) {
      const meterId = readSets[i].Meter.toString();
      if (!this.data.waterData.realtimeData.has(meterId)) {
        this.data.waterData.realtimeData.set(meterId, { entries: [] });
      }

      // Sort new data by ascending time
      let points = readSets[i].ReadData;
      points.sort(function(a,b) {
        return (a.Time_Stamp_UTC_ms - b.Time_Stamp_UTC_ms)
      });

      // Add fields for delta pulses and gallons/cu ft
      let meterData = this.getRealtimeDataForMeter(meterId);
      let meterPoints = this.getRealtimeEntriesForMeter(meterId);
      let lastPoint = this.lastRealtimeEntryForMeter(meterId);
      const startCount = meterData.length;
      let addCount = 0;

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
            /*
          point.Volume_1 = DataStore.getVolumeFromPulseCount(point.Pulse_Cnt_1);
          point.Volume_2 = DataStore.getVolumeFromPulseCount(point.Pulse_Cnt_2);
          point.Volume_3 = DataStore.getVolumeFromPulseCount(point.Pulse_Cnt_3);
          */
          point.Volume_1_Diff = DataStore.getVolumeFromPulseCount(point.Pulse_Cnt_1_Diff);
          point.Volume_2_Diff = DataStore.getVolumeFromPulseCount(point.Pulse_Cnt_2_Diff);
          point.Volume_3_Diff = DataStore.getVolumeFromPulseCount(point.Pulse_Cnt_3_Diff);
          meterPoints.push(point);
          lastPoint = point;
          addCount++;
        }
      }
      console.log("Added realtime data for meter " + meterId + ": prev=" +
       startCount + ", added=" + addCount);
    }
  };

  DataStore.prototype.processSummaryWaterData = function(rawResponse) {
     let serverData = JSON.parse(rawResponse);

     this.data.waterData.summaryData.timestamp = new Date();

     // Sort all data by ascending time
     serverData.sort(function(a,b) {
       return (a.End_Time_Stamp_UTC_ms - b.End_Time_Stamp_UTC_ms)
     });

     // For debugging:
     let meterCounts = new Map();

     for (let i = 0; i < serverData.length; i++) {
       const meterId = serverData[i].Meter.toString();
       if (!this.data.waterData.summaryData.has(meterId)) {
         this.data.waterData.summaryData.set(meterId, { entries: [] });
       }
       const point = serverData[i];
       let meterPoints = this.getSummaryEntriesForMeter(meterId);
       const lastPoint = this.lastSummaryEntryForMeter(meterId);
       if (!meterCounts.has(meterId)) {
          meterCounts.set(meterId, {start: meterPoints.length, added: 0, vol1: 0, vol2: 0, vol3: 0});
       }
       if (lastPoint && point.End_Time_Stamp_UTC_ms <= lastPoint.End_Time_Stamp_UTC_ms) {
         console.log("Skipping old/duplicate summary point at index [" + i + "]");
       } else {
         point.Volume_1_Diff = DataStore.getVolumeFromPulseCount(point.Pulse_Cnt_1_Diff);
         point.Volume_2_Diff = DataStore.getVolumeFromPulseCount(point.Pulse_Cnt_2_Diff);
         point.Volume_3_Diff = DataStore.getVolumeFromPulseCount(point.Pulse_Cnt_3_Diff);
         meterPoints.push(point);
         let mc = meterCounts.get(meterId);
         mc.added++;
         mc.vol1 += point.Volume_1_Diff;
         mc.vol2 += point.Volume_2_Diff;
         mc.vol3 += point.Volume_3_Diff;
       }
     }

     // For debugging:
     for (let [key, value] of meterCounts) {
       console.log("Added summary data for meter " + key + ": prev=" +
        value.start + ", added=" + value.added);
       console.log("Volume totals: pulse1=" + value.vol1 + ", pulse2=" + value.vol2 +
        ", pulse3=" + value.vol3);
     }
  };

  DataStore.getVolumeFromPulseCount = function(pulseCount) {
      return pulseCount * 0.748052;
  };

  DataStore.isValidDate = function(d) {
    return d instanceof Date && !isNaN(d);
  };

  function dateStringFromTimestamp(timestamp) {
    let d = new Date(timestamp);
    let year = d.getFullYear().toString();
    let month = ("0" + (d.getMonth() + 1)).slice(-2);
    let date = ("0" + d.getDate()).slice(-2);
    let hours = ("0" + d.getHours()).slice(-2);
    let minutes = ("0" + d.getMinutes()).slice(-2);
    return year + month + date + hours + minutes;
  }

  function beginningOfDayTimestamp(date) {
    let d = date || new Date();
    d.setHours(0,0,0,0);
    return d.getTime();
  }

  function endOfDayTimestamp(date) {
    let d = date || new Date();
    d.setHours(23,59,59,999);
    return d.getTime();
  }

  App.DataStore = DataStore;
  window.App = App;
})(window);
