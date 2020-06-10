(function (window) {
  'use strict';
  var App = window.App || {};

  function DataStore() {
    this.data = {
      waterData: {
        realtimeData: {},
        summaryData: {}
      },
      weatherData: {}
    };
  }

  DataStore.prototype.getWaterData = function(callback) {
    let realtimeRequest = 'https://io.ekmpush.com/readMeter?key=NjUyNDQ0Njc6Y2E5b0hRVGc&meters=350002883~350002885&ver=v4&fmt=json&cnt=720&fields=Pulse_Cnt_1~Pulse_Cnt_2~Pulse_Cnt_3';
    this.callApi(realtimeRequest, function(apiObject) {
      this.data.waterData.realtimeData = JSON.parse(apiObject);
      this.processWaterData();
      callback();
    }.bind(this));
    let summaryRequest = "";

  };

  DataStore.prototype.getWeatherData = function(callback) {
    var request = 'https://api.openweathermap.org/data/2.5/onecall?lat=36.974117&lon=-122.030792&units=imperial&exclude=minutely,hourly,daily&appid=4530c5f0704984be70de48b60f3ecd42';
    this.callApi(request, function(apiObject) {
      this.data.weatherData = JSON.parse(apiObject);
      callback();
    }.bind(this));
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

  DataStore.prototype.processWaterData = function() {
    let readSets = this.data.waterData.realtimeData.readMeter.ReadSet;
    if (!readSets) { return; }

    // Remove any data points with 0 pulse
    for (let i = 0; i < readSets.length; i++) {
      let setData = readSets[i].ReadData;
      for (let j = setData.length - 1; j >= 0; j--) {
        if (setData[j].Pulse_Cnt_1 == 0 && setData[j].Pulse_Cnt_2 == 0 &&
          setData[j].Pulse_Cnt_3 == 0) {
            console.log("Removing all-0 pulse count data point at [" + i + "][" + j + "]");
            setData[j].splice(j, 1);
          }
        }
    }

    // Sort all data by ascending time
    for (let i = 0; i < readSets.length; i++) {
      let setData = readSets[i].ReadData;
      setData.sort(function(a,b) {
        return (a.Time_Stamp_UTC_ms - b.Time_Stamp_UTC_ms)
      });
    }

    // Add fields for delta pulses and gallons/cu ft
    for (let i = 0; i < readSets.length; i++) {
      let setData = readSets[i].ReadData;
      for (let j = 0; j < setData.length; j++) {
        setData[j].Pulse_Diff_1 = j > 0 ?
          setData[j].Pulse_Cnt_1 - setData[j-1].Pulse_Cnt_1 : 0;
        setData[j].Pulse_Diff_2 = j > 0 ?
          setData[j].Pulse_Cnt_2 - setData[j-1].Pulse_Cnt_2 : 0;
        setData[j].Pulse_Diff_3 = j > 0 ?
          setData[j].Pulse_Cnt_3 - setData[j-1].Pulse_Cnt_3 : 0;
        setData[j].Volume_1 = getVolumeFromPulseCount(setData[j].Pulse_Cnt_1);
        setData[j].Volume_2 = getVolumeFromPulseCount(setData[j].Pulse_Cnt_2);
        setData[j].Volume_3 = getVolumeFromPulseCount(setData[j].Pulse_Cnt_3);
        setData[j].Volume_Diff_1 = getVolumeFromPulseCount(setData[j].Pulse_Diff_1);
        setData[j].Volume_Diff_2 = getVolumeFromPulseCount(setData[j].Pulse_Diff_2);
        setData[j].Volume_Diff_3 = getVolumeFromPulseCount(setData[j].Pulse_Diff_3);
      }
    }
  };

   function getVolumeFromPulseCount(pulseCount) {
      return pulseCount * 0.748052;
  }

  App.DataStore = DataStore;
  window.App = App;
})(window);
