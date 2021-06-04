const initialState = {
  trips:{
      'activeTrips':[],
      'finishedTrips': [],
      'cancelledTrips': [],
      'visibleTrips':[]
  },
  count : {
    'activeTrips':0,
    'finishedTrips': 0,
    'cancelledTrips': 0
  },
}

const  updateTripReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'updateCount': 
        return ({...state,['count']:action.payload.count})
    case 'updateTrips' : 
    return ({...state,['trips']:action.payload.trips})
  }
  return state
}

export default updateTripReducer;