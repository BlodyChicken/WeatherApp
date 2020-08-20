/***************************************************************************************
 frontpage.js  
 ***************************************************************************************/
import React from "react";
import { StatusBar } from 'expo-status-bar';
import { AsyncStorage } from 'react-native';
import { useState, useEffect} from 'react';
import { RefreshControl, TextInput, Image, TouchableOpacity, ImageBackground, StyleSheet, Text, View, Dimensions, ScrollView, Alert  } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const window = Dimensions.get("window");
const screen = Dimensions.get("screen");

/*************************************************************************************
 Main Function
**************************************************************************************/
function frontpage ({ navigation })
{ 
  // definition af vejr ikoner med reference til openweather koder
  let wIcons={
    "01d":require('./assets/sun.png'),
    "01n":require('./assets/sun.png'),
    "02d":require('./assets/pcloud.png'),
    "02n":require('./assets/pcloud.png'),
    "03d":require('./assets/cloud.png'),
    "03n":require('./assets/cloud.png'),
    "04d":require('./assets/cloud.png'),
    "04n":require('./assets/cloud.png'),
    "09d":require('./assets/rain.png'),
    "09n":require('./assets/rain.png'),
    "10d":require('./assets/sunrain.png'),
    "10n":require('./assets/sunrain.png'),
    "11d":require('./assets/thunder.png'),
    "11n":require('./assets/thunder.png'),
    "13d":require('./assets/snow.png'),
    "13n":require('./assets/snow.png'),
    "50d":require('./assets/mist.png'),
    "50n":require('./assets/mist.png')
  };

  // def. af latitude og longitude.
  const [latitude, setlatitude]=React.useState();
  const [longitude, setlongitude]=React.useState();

  // håndtering af evt. ændring af skærm størrelse.
  const [dimensions, setDimensions] = useState({ window, screen });
  const onChange = ({ window, screen }) => {setDimensions({ window, screen });};
  useEffect(() => {Dimensions.addEventListener("change", onChange);return () => {Dimensions.removeEventListener("change", onChange);};});
  
  // håndtering af scrollview opdatering når byer bliver gemt eller slettet.
  const [refreshing, setRefreshing] = React.useState(false);
  const wait = (timeout) => {return new Promise(resolve => {setTimeout(resolve, timeout);});};
  const onRefresh = React.useCallback(() => {setRefreshing(true);wait(1).then(() => setRefreshing(false));}, []);

  // def. af div variable til at håndtere appen
  const [loadedCityes, setCityes] = useState([]);
  const [city, setCity] = useState();
  const [degrees, setDegrees] = useState(0);
  const [CityValue, ChangeCity] = useState();
  
  const [weather, setWeather] = useState([]);
  const [forcast, setForcast] = useState([]);

  const [todayicon, setTodayIcon] = useState();

  // initialicering af appen
  useEffect(() => {getLocation();console.log("Get Current location");},[]);
  useEffect(() => {loadCityes();console.log("User City loaded");},[]);
  
  // getLocation henter nuværende position hvis funktionen ikke bliver tildelt en lat eller lon.
  // Efter funktionen har fundet eller fået tildelt en lat/lon bliver vejret hentet.
  function getLocation(lat="",lon="")
  { 
      if (lat=="")
      {
        navigator.geolocation.getCurrentPosition(
        position=>
        {
          lat=position.coords.latitude;
          lon=position.coords.longitude;   
        });       
      }
      if (lat==""||lon=="") {lat=56.4657553;lon=9.4121147;}
      setlatitude(lat); 
      setlongitude(lon);
      fetchWeather("",lat,lon);
  }

  // fetchWeather henter vejret fra openweater via 2 forskellige api'er
  // Hvis funktionen ikke får tildelt et bynavn bliver lat og lon benyttet.
  // Hvis funktionen får tildelt et bynavn bliver byens lat og lon slået op i openweather og 
  // funktionen bliver kaldt igen med byens lat og lon.
  function fetchWeather(cityName="",lat = latitude, lon = longitude) {
    let apiArray={};
    let link="";
    
    if (cityName=="")
    {
      console.log("Getting weather by "+lat+" x "+lon);
      link='https://api.openweathermap.org/data/2.5/onecall?lat='+lat+'&lon='+lon+'&exclude={part}&units=metric&appid=5a9b05d90d9eecbaa85ab2bd525727c6';
    }
    else
    {
      console.log("Getting weather by City:"+cityName);
      link='http://api.openweathermap.org/data/2.5/weather?q='+cityName+'&appid=5a9b05d90d9eecbaa85ab2bd525727c6';
    }

    // hent api
    fetch(
      link
    )
      .then(res => res.json())
      .then(json => {
        // Dan array baseret på openweather's json responce
        apiArray=JSON.parse(JSON.stringify(json));
        if (cityName!="" || apiArray.lat) 
        {        
          if (cityName!="")
          {
            // hent udvidet oplysninger baseret på byens lat og lon.  
            fetchWeather("",apiArray.coord.lat , apiArray.coord.lon);
          }
          else
          { // opdater oplysninger
            setlatitude(apiArray.lat); 
            setlongitude(apiArray.lon);
            setWeather(apiArray);
            setDegrees(apiArray.current.temp);
            setTodayIcon(wIcons[apiArray.current.weather[0].icon]);
            setForcast([apiArray.daily[0].weather[0].icon,apiArray.daily[1].weather[0].icon,apiArray.daily[2].weather[0].icon,apiArray.daily[3].weather[0].icon,apiArray.daily[4].weather[0].icon,apiArray.daily[5].weather[0].icon]);
          }
          
        }
        else
        console.log("Error: "+apiArray.message);
      });
  }

  // funktionen bruges i forbindelse med opdatering af city input feltet.
  function textChangeHandler(evt)
  {
    ChangeCity(evt.nativeEvent.text);
  }

  // lookupCityes håndtere/opdatere appen hvis der bliver valgt en by i tekst feltet
  // eller hvis en af de gemte byer bliver klikket på.
  function lookupCityes(selectedCity)
  {
    if (typeof selectedCity === "object") 
    {
      setCity(CityValue);
      fetchWeather(CityValue);
    } else 
    {
      setCity(selectedCity);
      fetchWeather(selectedCity);
    }
  }

  // loadCityes henter bruger gemte byer
  async function loadCityes()
  {
      try {
        const value = await AsyncStorage.getItem('Cityes');
        if (value !== null) 
        { 
          // Omdanner resultat til en array
          setCityes(value.split("\n"));
        }
      } catch (error) {Alert.alert("Error loading City");}
  }

  // saveCityes ondanner listen over byer og gemmer den som en normal "text" fil.
  // når byen er gemt opdateres scrollviewet over byer.
  async function saveCityes()
  { 
    try {
        await AsyncStorage.setItem('Cityes',loadedCityes.toString().replace(/,/g,"\n"));
      } catch (error) {console.log("Error Saving"); };
      setCityes(loadedCityes);
      onRefresh();
  }

  // removeCity fjerner en by fra listen over byer og gemmer resultatet
  function removeCity(key)
  {
    loadedCityes.splice(key, 1);
    console.log("Removes City");
    saveCityes();
  }

  // ************************************************** App layout ************************************************
    return (
      <View style={styles.container}>
        <ImageBackground source={ require('./assets/background.jpg')} style={styles.image}>
          <Image source={ require('./assets/background.jpg')} style={{width:dimensions.screen.width,height:0}} />
          
          <View style={styles.sectionA}>
          <LinearGradient colors={['rgba(255,255,255,0.8)', 'transparent']} style={{position: 'absolute',left: 0,right: 0,top: 0,height: 100,}}/>
            <Text style={styles.title}>Weather App</Text>
          </View>

          <View style={styles.sectionA} >
            {<Image source={todayicon} style={{width:110,height:110}} />
            }
            <Text style={styles.titleA}>{' '+degrees+'°'}</Text>
          </View>

          <View style={styles.sectionA}><Text style={styles.titleB}>{city}</Text></View>

          <View style={styles.sectionD}>
            <Text style={styles.titleC}>Forcast</Text>
            <View style={styles.sectionH}>
              <Text style={styles.titleC}>lat:{latitude}</Text>
              <Text style={styles.titleC}> - </Text>
              <Text style={styles.titleC}>lon:{longitude}</Text>
            </View>
          </View>
          
          <View style={styles.sectionB}>
            <LinearGradient colors={['rgba(255,255,255,0.8)', 'transparent']} style={{position: 'absolute',left: 0,right: 0,top: 0,height: 50,}}/>
            {forcast.map((item, key) => (<Image key={"img_"+key} source={wIcons[item]} style={styles.weekicon} />))}
          </View>

          <View suppressKeyWarning style={styles.sectionE}>
            <LinearGradient colors={['transparent','rgba(255,255,255,0.8)','transparent']}>
                <TextInput style={styles.textInput}
                  backgroundColor={['transparent','rgba(255,255,255,0.5)']}
                  onChange={textChangeHandler}
                  onSubmitEditing={lookupCityes}
                  name="cityText"
                />
            </LinearGradient>
            <Text > </Text>
            <TouchableOpacity  onPress={() => {loadedCityes.push(CityValue);saveCityes();}}>
                <LinearGradient colors={['rgba(255,255,255,0.8)','transparent','rgba(255,255,255,0.8)']} style={{height: 20}}>
                <Text style={styles.useCityButton}>Save City</Text>
                </LinearGradient>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>}>
            {
              loadedCityes.map((item, key) => (
              <View key={"view_"+key} style={styles.sectionG}>
                <TouchableOpacity  onPress={() => lookupCityes(item)}>
                  <Text style={styles.cityButton}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity  onPress={() => removeCity(key)}>
                  <Image source={require('./assets/trash.png')} style={styles.deleteCityIcon} />
                </TouchableOpacity>
              </View>
              ))
            }
          </ScrollView>

          <View style={styles.sectionF}>
            <LinearGradient colors={['transparent','rgba(255,255,255,0.8)']} style={{position: 'absolute',left: 0,right: 0,top: 0,height: 50,}}/>
            <TouchableOpacity style={styles.addCityButton} onPress={() => navigation.navigate('About')}>
                  <Text style={styles.addCityButton}>About Weather App</Text>
            </TouchableOpacity>
          </View>
          <StatusBar style="auto" />
        </ImageBackground>
      </View>
    );
  }

// *********************************************** App Style ***********************************************************
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      paddingTop:20
    },
    sectionA: {
      flex: 0.3,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderColor:'#00FFFF'
    },
    sectionB: {
      flex: 0.2,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderColor:'#00FFFF',
      borderWidth:1,
      borderBottomWidth:0,
      borderTopWidth:0,
    },
    sectionC: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      borderColor:'#00FFFF',
    },
    sectionD: {
      flex: 0.1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexDirection: 'row',
      borderColor:'#00FFFF',
      borderWidth:1,
      borderBottomWidth:0,
      paddingLeft:5,
    },
    sectionE: {
      flex: 0.1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexDirection: 'row',
      borderColor:'#00FFFF',
      borderWidth:1,
      borderBottomWidth:0,
      borderTopWidth:0,
      paddingLeft:5,
      paddingBottom:5
    },
    sectionF: {
      flex: 0.13,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      borderColor:'#00FFFF',
      borderWidth:1,
    },
    sectionG: {
      flex: 0.13,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    sectionH: {
      flex: 0.97,
      alignItems: 'center',
      justifyContent: 'flex-end',
      flexDirection: 'row',
      paddingLeft:5,
    },
    scrollView: {
      flex: 1,
      flexDirection: 'column',
      borderColor:'#00FFFF',
      borderWidth:1,
    },
    image: {
      flex: 1,
      resizeMode: "cover",
      justifyContent: "center",
    },
    title: {
        color:"#FFFFFF",
        fontWeight: "bold",
        fontSize:40,
    },
    titleA: {
      color:"#FFFFFF",
      fontWeight: "bold",
      fontSize:60,
      marginVertical: 4
    },
    titleB: {
      color:"#FFFFFF",
      fontWeight: "bold",
      fontSize:30,
      marginVertical: 4
    },
    titleC: {
      color:"#FFFFFF",
      fontWeight: "bold",
      fontSize:10,
    },
    cityButton: {
      color:"#FFFFFF",
      fontWeight: "normal",
      fontSize:30,
      marginVertical: 4,
    },
    addCityButton: {
      color:"#FFFFFF",
      fontWeight: "bold",
      fontSize:20,
      marginVertical: 4
    },
    useCityButton: {
      color:"#FFFFFF",
      fontWeight: "bold",
      fontSize:13,
      paddingLeft:10,
      paddingRight:10,
    },
    textInput: {
      width: 260,
      height: 22, 
      color:"#333333",
      borderColor: 'gray',
      borderWidth: 1, 
      paddingLeft:5,
  },
    weekicon:{
      width:40,
      height:40
    },
    deleteCityIcon:{
      width:20,
      height:30,
      marginLeft:15
    }
  });

export default frontpage;
