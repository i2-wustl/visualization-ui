
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

function compareDates(a, b) {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
}

function binarySearchFirstOccurrence(haystack, needle, comparator, low, high) {
    let mid, cmp;

    if(low === undefined)
        low = 0;

    else {
        low = low|0;
        if(low < 0 || low >= haystack.length)
            throw new RangeError("invalid lower bound");
    }

    if(high === undefined)
        high = haystack.length - 1;

    else {
        high = high|0;
        if(high < low || high >= haystack.length)
            throw new RangeError("invalid upper bound");
    }

    while(low <= high) {
        // The naive `low + high >>> 1` could fail for array lengths > 2**31
        // because `>>>` converts its operands to int32. `low + (high - low >>> 1)`
        // works for array lengths <= 2**32-1 which is also Javascript's max array
        // length.
        mid = low + ((high - low) >>> 1);
        cmp = +comparator(haystack[mid], needle, mid, haystack);

        // Too low.
        if(cmp < 0.0)
            low  = mid + 1;

        // Too high.
        else if(cmp > 0.0)
            high = mid - 1;
        // Equal but range is not fully scanned
        else if (low != mid)
            high = mid;
        // Key found.
        else
            return mid;
    }

    // Key not found. -(index + 1) where index is insertion point to maintain sorted order
    return ~low;
}



