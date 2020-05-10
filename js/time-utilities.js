
/********************************************************************************
 ********************************** Utility - Time ******************************
 ********************************************************************************/

function datesAreOnSameDay(first, second) {
    return (first.getDate() === second.getDate() &&
        first.getMonth() === second.getMonth() &&
        first.getFullYear() === second.getFullYear());
}

function getDateAfterDays(currentDate, days) {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + days,
        currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds());
}

function daysBetween(startDate, endDate) {
    return (treatAsUTC(endDate) - treatAsUTC(startDate)) / 86400000; // millisecondsPerDay = 24 * 60 * 60 * 1000
}

function treatAsUTC(date) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
}



