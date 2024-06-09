const aMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekDays = ["S","M","T","W","T","F","S"]
const objTimeZoneSet = {
    "Asia/Kolkata" : "India",
    "Asia/Singapore" : "Singapore",
    "America/New_York" : "New York"
}

/* -------------------------------------------------------------------------- */
/*                    Section of Rendaring inital meterial                    */
/* -------------------------------------------------------------------------- */

//initialize the time zone on page load
document.addEventListener('DOMContentLoaded', initializeTimeZone);

// Function to initialize the time zone on page loads
function initializeTimeZone() {
    let timeZone = localStorage.getItem('timeZone');
    renderDate();
    if (!timeZone) {
        setTimeZone("Asia/Kolkata");
    }
    renderTimeZoneOptions();
    checkAndUpdateDayOfWeek("Asia/Kolkata");
    renderStoredAlarm();
    setTimeToAlarmField();
    renderUpcomingAlarm();
}

function renderStoredAlarm(){
    let aAlarms = getAlarmDetailsFromDB();
    let aobJectArr = []
    if(aAlarms){
        for(key in aAlarms){
            aobJectArr.push(new Alarm(aAlarms[key]));
        }
    }
}

// Render the time zone after any change or update
function renderTimeZoneOptions(){
    let timeZoneSelect = document.getElementById('timeZone');
    let timeZone = localStorage.getItem('timeZone');
    timeZoneSelect.innerHTML = '';

    for (let key in objTimeZoneSet) {
        let option = document.createElement("option");
        option.value = key;
        option.text = objTimeZoneSet[key];
        if (key === timeZone) {
            option.selected = true;
        }
        timeZoneSelect.appendChild(option);
    }
    renderDate();
}

// render today day
function renderDate(){
    let timeZone = getTimeZone();
    let oDate = getTimeInTimeZone(timeZone);
    const day = oDate.day;
    const month = oDate.month;
    const year = oDate.year;
    document.getElementById("toDay").innerHTML = `${day}&nbsp${month}&nbsp${year}`
}


// Function to check and update the day of week if needed
function checkAndUpdateDayOfWeek(timeZone) {
    const storedData = localStorage.getItem('dayOfWeek');
    if (storedData) {
        const { dayOfWeek, expires } = JSON.parse(storedData);
        const now = new Date().getTime();
        if (now > expires) {
            updateDayOfWeek(timeZone);
        }
    } else {
        updateDayOfWeek(timeZone);
    }
}

function setTimeToAlarmField(){
    let now = new Date();
    let timeForm = document.querySelector("#setAlarm .setAlarmFormContainer .setTimeForm");
    const timeFormChild = timeForm.children;
    if(timeFormChild){
        timeFormChild.hour.value = (now.getHours()%12).toString().padStart(2,"0");
        timeFormChild.second.value = now.getSeconds().toString().padStart(2,"0"),
        timeFormChild.minute.value = now.getMinutes().toString().padStart(2,"0"),
        timeFormChild.format.value  = now.getHours() >= 12 ? "PM" : "AM"
    }
}

function renderUpcomingAlarm(){
    const oAlarms = getAlarmDetailsFromDB();
    let count = 2;
    const eUpcomingAlarm = document.getElementById("upcomingAlarm");
    eUpcomingAlarm.innerHTML = "";
    Object.keys(oAlarms).forEach((element) => {
        if(oAlarms[element].status && count>0){
            const eCreateAlarmInfo = document.createElement("span");
            eCreateAlarmInfo.className = "alarm-info";
            eCreateAlarmInfo.textContent = `${oAlarms[element].hour}:${oAlarms[element].minute}:${oAlarms[element].second} ${oAlarms[element].format}`;
            
            eUpcomingAlarm.appendChild(eCreateAlarmInfo);
            count--;
        }
    })
}
//------------------------------------------END------------------------------------------




/* -------------------------------------------------------------------------- */
/*                   Section related to Time update and get                   */
/* -------------------------------------------------------------------------- */

// getTime Object based on time zone
function getTimeInTimeZone(timeZone,format12) {
    let oDate = new Date();
    let options = { 
        timeZone: timeZone,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: (format12!=undefined)?format12 : true
    };
    let timeFormatter = new Intl.DateTimeFormat('en-US', options);
    let formattedTimeParts = timeFormatter.formatToParts(oDate);
    let oTimes = {};
    
    formattedTimeParts.forEach(part => {
        oTimes[part.type] = part.value;
    });
    
    return oTimes;
}

// Function to get the day of the week as a number (Sunday = 0, Monday = 1, ..., Saturday = 6)
function getDayOfWeek(timeZone) {
    let oDate = new Date();
    let options = { timeZone: timeZone, weekday: 'short' };
    let dayFormatter = new Intl.DateTimeFormat('en-US', options);
    let formattedDayParts = dayFormatter.formatToParts(oDate);
    let dayOfWeekStr = formattedDayParts.find(part => part.type === 'weekday').value;
    
    const daysOfWeek = {
        'Sun': 0,
        'Mon': 1,
        'Tue': 2,
        'Wed': 3,
        'Thu': 4,
        'Fri': 5,
        'Sat': 6
    };
    
    return daysOfWeek[dayOfWeekStr];
}

// update the time display every second
setInterval(() => {
    let timeZone = getTimeZone();
    let oTimes = getTimeInTimeZone(timeZone);
    
    document.getElementById("hour").innerHTML = oTimes.hour;
    document.getElementById("minute").innerHTML = oTimes.minute;
    document.getElementById("second").innerHTML = oTimes.second;
    document.getElementById("timeFormat").innerHTML = oTimes.dayPeriod;
    checkForAlarm(oTimes.hour +  oTimes.minute + oTimes.second + oTimes.dayPeriod)
}, 1000);

function checkForAlarm(key){
    const oAlaram = getAlarmDetailsFromDB(key);
    const storedData = localStorage.getItem('dayOfWeek');
    if (oAlaram != null && typeof oAlaram === 'object' && Object.keys(oAlaram).length > 0) {
        let { dayOfWeek, expires } = JSON.parse(storedData);
        if(oAlaram && oAlaram.status && oAlaram.days.has(JSON.stringify(dayOfWeek)) ){
            alert("alarm");
        }
    }
}


//------------------------------------------END------------------------------------------



/* -------------------------------------------------------------------------- */
/*                     Serction for funtions used in HTML                     */
/* -------------------------------------------------------------------------- */

function onTimeZoneChange(oEvent){
    setTimeZone(oEvent.value);
    renderDate()
}




// store timezone in local DB
function setTimeZone(timeZone) {
    localStorage.setItem('timeZone', timeZone);
}

// getTimezone
function getTimeZone() {
    let timeZone = localStorage.getItem('timeZone');
    if(!timeZone)
        setTimeZone("Asia/Kolkata");
    return localStorage.getItem('timeZone');
}


// function to set alarm
function createAlarm(oEvent){
    const setAlarmContainer = document.getElementById("setAlarm");
    let timeForm = document.querySelector("#setAlarm .setAlarmFormContainer .setTimeForm");
    const timeFormChild = timeForm.children;
    if( timeFormChild.hour.value >= 1 && timeFormChild.hour.value <=12 &&
        timeFormChild.minute.value >=0 && timeFormChild.minute.value <=59 &&
        timeFormChild.second.value >=0 && timeFormChild.second.value <= 59 &&
        (timeFormChild.format.value == "AM" || timeFormChild.format.value == "PM")
    )
    {
        const weeks = document.querySelector("#setAlarm .setAlarmFormContainer .weeks-container");
        let payload = {
            hour : timeFormChild.hour.value.padStart(2,"0"),
            second : timeFormChild.second.value.padStart(2,"0"),
            minute : timeFormChild.minute.value.padStart(2,"0"),
            format : timeFormChild.format.value,
            days : getSelectedDays(weeks.children),
            status: true
        }
        let getAlarmFromDB = getAlarmDetailsFromDB({...payload});
        if(!getAlarmFromDB || Object.keys(getAlarmFromDB).length == 0){
            setAlarmDetailsToDB({...payload});
            let alarm1 = new Alarm(payload);
        }
        console.log(payload);
    }
    else{
        alert("Please enter correct time");
    }
    
    
}

// select the date
function onWeekDaysPress(oEvent){
    oEvent.classList.toggle("selectedDay");
}

//------------------------------------------END------------------------------------------



/* -------------------------------------------------------------------------- */
/*                       Section for local DB operation                       */
/* -------------------------------------------------------------------------- */

// function to get seleted days of a week
function getSelectedDays(weekElement){
    let days = new Set();
    for(let i = 0; i < weekElement.length; i++){
        let element = weekElement[i];
        if(element.className.indexOf("selectedDay") >= 0)
            days.add(element.dataset.day)
    }
    return days;
}

// get Alarm details from local storage
function getAlarmDetailsFromDB(alarm){
    let aAlarmDetails = localStorage.getItem("alarms");

    if(!aAlarmDetails){
        localStorage.setItem("alarms",JSON.stringify({}));
        return JSON.parse(localStorage.getItem("alarms"));
    }

    if(!alarm){
        aAlarmDetails = JSON.parse(aAlarmDetails);
        for(key in aAlarmDetails){
            aAlarmDetails[key].days = new Set(aAlarmDetails[key].days );
        }
        return aAlarmDetails;
    }
    else if(typeof alarm == "string"){
        let obj = JSON.parse(aAlarmDetails)[alarm];
        if(obj){
            obj.days = new Set(obj.days);
            return obj;
        }
        return null;
        
    }
    else if(typeof alarm === "object"){
        let key = alarm.hour + alarm.minute + alarm.second + alarm.format;
        let obj = JSON.parse(aAlarmDetails)[key];
        if(obj){
            obj.days = new Set(obj.days);
            return obj;
        }
        return null;
        
    }
}

// set alaram info on local storage
function setAlarmDetailsToDB(alarmInfo){
    let aAlarmDetails = JSON.parse(localStorage.getItem("alarms"));
    if(!alarmInfo){
        return;
    }
    let key = alarmInfo.hour + alarmInfo.minute + alarmInfo.second + alarmInfo.format;
    alarmInfo.days = Array.from(alarmInfo.days);
    aAlarmDetails[key] = alarmInfo;
    aAlarmDetails = sortObjectByCloseness(aAlarmDetails);
    localStorage.setItem("alarms",JSON.stringify(aAlarmDetails));

    // update the upcomming alaram list
    renderUpcomingAlarm();
}

// delete alaram info on local storage
function deleteAlarmFreomDB(alarmInfo){
    let aAlarmDetails = JSON.parse(localStorage.getItem("alarms"));
    if(!aAlarmDetails){
        return;
    }
    let key = alarmInfo.hour + alarmInfo.minute + alarmInfo.second + alarmInfo.format;
    delete aAlarmDetails[key];
    localStorage.setItem("alarms",JSON.stringify(aAlarmDetails));

    // update the upcomming alaram list
    renderUpcomingAlarm();
}

// Function to update day of week in localStorage
function updateDayOfWeek(timeZone) {
    const currentDayOfWeek = getDayOfWeek(timeZone);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 1);
    expirationDate.setHours(0, 0, 0, 0);
    
    const dayOfWeekData = {
        dayOfWeek: currentDayOfWeek,
        expires: expirationDate.getTime()
    };
    
    localStorage.setItem('dayOfWeek', JSON.stringify(dayOfWeekData));
}

//------------------------------------------END------------------------------------------



/* -------------------------------------------------------------------------- */
/*                                 Class Alarm                                */
/* -------------------------------------------------------------------------- */

class Alarm{
    #id
    #alarmDateTime;
    #days;
    #status

    constructor(alaramInfo){
        if(alaramInfo.days){
            this.#days =  alaramInfo.days;
            delete alaramInfo.days;
        }else{
            this.#days = new Set();
        }

        let alarmTime = alaramInfo.hour +
                        alaramInfo.minute +
                        alaramInfo.second +
                        alaramInfo.format;
        this.#id = alarmTime;
        
        if(alaramInfo.status){
            this.#status =JSON.parse(JSON.stringify(alaramInfo)).status;
            delete alaramInfo.status;
        }
        else{
            this.#status = true;
        }

        // if single of the not selected then status shoud be off
        if(this.#days.size == 0)
            this.#status = false;

        this.#alarmDateTime =  alaramInfo;
        this.initialRender();
    }

    get alarmDateTime(){
        return this.#alarmDateTime;
    }
    get id(){
        return this.#id;
    }

    get selectorQuery(){
        return `#disPlayAlarmContainer [id="${this.#id}"]`
    }

    get days(){
        return this.#days;
    }

    // update the days for alarma
    updateWeekDay(day){
        let payLoad = this.#alarmDateTime;
        let renderAction = false;

        if(this.#days.has(day))
            this.#days.delete(day);
        else
            this.#days.add(day);

        if(this.#days.size == 0 && this.#status){
            this.#status = false;
            renderAction = true;
        }

        if(this.#days.size > 0 && !this.#status){
            this.#status = true;
            renderAction = true;
        }

        payLoad.days = this.#days;
        payLoad.status = this.#status;

        setAlarmDetailsToDB(payLoad);
        if(renderAction)
            this.renderActionButton();
    }
    
    get status(){
        return this.#status
    }

    set status(status){
        this.#status = status;
    }

    // render the alarm details
    initialRender(){
        let cloneSetAlarm = document.getElementById("setAlarm").cloneNode(true);
        cloneSetAlarm.id = this.id;

        let eSetAlarmFormContainer = cloneSetAlarm.children[0];
        const eSetTimeFormChild = eSetAlarmFormContainer.children[0].children;

        eSetTimeFormChild.hour.value = this.#alarmDateTime.hour;
        eSetTimeFormChild.hour.readOnly = true;

        eSetTimeFormChild.minute.value = this.#alarmDateTime.minute;
        eSetTimeFormChild.minute.readOnly = true;

        eSetTimeFormChild.second.value = this.#alarmDateTime.second;
        eSetTimeFormChild.second.readOnly = true;

        eSetTimeFormChild.format.value = this.#alarmDateTime.format;
        eSetTimeFormChild.format.readOnly = true;

        document.getElementById("disPlayAlarmContainer").appendChild(cloneSetAlarm);
        console.log("test");
        this.renderDays();
        this.renderActionButton();
    }

    // render action button of the alarm details
    renderActionButton(){
        const eSetAlarm = document.querySelector(this.selectorQuery);
        const eAlarmActionContainer = eSetAlarm.children[1];
        eAlarmActionContainer.innerHTML = "";

        // creating  alram off on button
        const btn1 = document.createElement("button");
        btn1.className = "btn btn-edit";
        if(this.status){
            btn1.innerHTML = `<span class="material-symbols-rounded">alarm_on</span>`
        }
        else{
            btn1.innerHTML = `<span class="material-symbols-rounded">alarm_off</span>`
        }
        btn1.addEventListener("click", (oEvent) => {
            let actionText  = oEvent.target.innerHTML;
            let payLoad = this.#alarmDateTime;
            payLoad.days =this.#days;

            if(actionText == 'alarm_off'){
                payLoad.status = true;
                setAlarmDetailsToDB(payLoad);
                oEvent.target.innerHTML = "alarm_on";
            }
            else{
                payLoad.status = false;
                setAlarmDetailsToDB(payLoad);
                oEvent.target.innerHTML = "alarm_off"
            }
        })
        eAlarmActionContainer.appendChild(btn1);

        // creating button for delete button
        const btn2 = document.createElement("button");
        btn2.className = "btn btn-delete";
        btn2.innerHTML = `<span class="material-symbols-rounded">delete</span>`
        btn2.addEventListener("click",(oEvent) => {
            const eSetAlarm = document.querySelector(this.selectorQuery);
            deleteAlarmFreomDB(this.#alarmDateTime);
            document.querySelector("#disPlayAlarmContainer").removeChild(eSetAlarm);
        });
        eAlarmActionContainer.appendChild(btn2);
    }

    // render alarm information
    renderDays(){
        const eSetAlarm = document.querySelector(this.selectorQuery);
        const eWeekContainer = eSetAlarm.children[0].children[1];
        eWeekContainer.innerHTML = "";

        weekDays.forEach((dayName, index) => {
            const day = document.createElement("span");
            day.className = (this.#days.has(""+index))? "day selectedDay" : "day";
            day.textContent = dayName;
            day.setAttribute('data-day', ""+index);
            day.addEventListener("click", (oEvent)=> {
                
                oEvent.target.classList.toggle("selectedDay");
                this.updateWeekDay(oEvent.target.getAttribute("data-day"));
                this.renderDays();
            });
            eWeekContainer.append(day);
        });
    }
}

//------------------------------------------END------------------------------------------



/* -------------------------------------------------------------------------- */
/*                           Section for Validations                          */
/* -------------------------------------------------------------------------- */

// Function to limit the input to 2 digits and ensure it's within the valid range
function limitDigits(oEvent,input) {
    if (input.value.length > input.maxLength) {
        input.value = input.value.slice(0, input.maxLength);
    }
    const inputName = input.name;
    if (inputName === 'hour') {
        validateHour(input);
    } else if (inputName === 'minute') {
        validateMinute(input);
    } else if (inputName === 'second') {
        validateSecond(input);
    } else if (inputName === 'format') {
        validate12HourFormat(input,oEvent);
    }
}

// Function to validate hours (0-12)
function validateHour(input) {
    let value = parseInt(input.value);
    if (value < 0) {
        input.value = 0;
    } else if (value > 12) {
        input.value = 12;
    }
}

// Function to validate minutes (0-59)
function validateMinute(input) {
    let value = parseInt(input.value);
    if (value < 0) {
        input.value = 0;
    } else if (value > 59) {
        input.value = 59;
    }
}

// Function to validate seconds (0-59)
function validateSecond(input) {
    let value = parseInt(input.value);
    if (value < 0) {
        input.value = 0;
    } else if (value > 59) {
        input.value = 59;
    }
}

// Function to validate the AM/PM input
function validate12HourFormat(input,oEvent) {
    const value = input.value.toUpperCase();
    if(value.length == 1){
        if(value !== 'A' && value !== 'P'){
            input.value = '';
        }
        else if(value == 'A'){
            input.value = 'A';
        }
        else if(value == 'P'){
            input.value = 'P';
        }
        
    }
    else if(value.length == 2){
        input.value =  value.substring(0,1) + "M"
    }
    else{
        input.value = ""
    }
}


//------------------------------------------END------------------------------------------



/* -------------------------------------------------------------------------- */
/*                 Section for Sorting the Alarms base on time                */
/* -------------------------------------------------------------------------- */

// Function to get the current time in minutes since midnight
function getCurrentTimeInMinutes() {
    const now = getTimeInTimeZone("Asia/Kolkata",false);
    return parseInt(now.hour) * 3600 + parseInt(now.minute) * 60 + parseInt(now.second);
}

// Function to calculate the time in minutes
function getTimeInMinutes(hour, minute, second, format) {
    let hours = parseInt(hour);
    const minutes = parseInt(minute);
    const seconds = parseInt(second);
    
    if (format === 'PM' && hours < 12) hours += 12;
    if (format === 'AM' && hours === 12) hours = 0;

    return hours * 3600 + minutes * 60 + seconds;
}

// Function to calculate the closeness of a given time to the current time
function calculateCloseness(hour, minute, second, format, days) {
    const currentDay = getDayOfWeek("Asia/Kolkata");
    const currentTimeInMinutes = getCurrentTimeInMinutes();
    const targetTimeInMinutes = getTimeInMinutes(hour, minute, second, format);

    let closest = 7 * 24 * 3600;
    days.forEach(day => {
        const dayNum = parseInt(day);
        let dayDifference = dayNum - currentDay;
        if (dayDifference < 0) dayDifference += 7;

        const dayDifferenceInSeconds = dayDifference * 24 * 3600;
        const timeDifference = targetTimeInMinutes - currentTimeInMinutes;
        const totalDifference = dayDifferenceInSeconds + timeDifference;

        if (totalDifference < closest) closest = totalDifference;
    });

    return closest;
}

// Function to sort the object based on the closest time from today
function sortObjectByCloseness(obj) {
    const sortedEntries = Object.entries(obj).sort((a, b) => {
        const closenessA = calculateCloseness(a[1].hour, a[1].minute, a[1].second, a[1].format, a[1].days);
        const closenessB = calculateCloseness(b[1].hour, b[1].minute, b[1].second, b[1].format, b[1].days);
        return closenessA - closenessB;
    });
    
    const sortedObj = {};
    sortedEntries.forEach(([key, value]) => {
        sortedObj[key] = value;
    });
    return sortedObj;
}