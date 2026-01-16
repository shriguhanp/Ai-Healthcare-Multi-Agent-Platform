import { getDistance } from 'geolib';

// Calculate distance between two coordinates in kilometers
export const calculateDistance = (coord1, coord2) => {
    if (!coord1.lat || !coord1.lng || !coord2.lat || !coord2.lng) {
        return 0;
    }

    const distanceInMeters = getDistance(
        { latitude: coord1.lat, longitude: coord1.lng },
        { latitude: coord2.lat, longitude: coord2.lng }
    );

    return (distanceInMeters / 1000).toFixed(2); // Convert to km and round to 2 decimals
};

// Filter doctors by location radius
export const filterByRadius = (doctors, userLocation, radiusKm) => {
    return doctors.filter(doctor => {
        if (!doctor.location?.coordinates?.lat || !doctor.location?.coordinates?.lng) {
            return false;
        }

        const distance = calculateDistance(userLocation, doctor.location.coordinates);
        return distance <= radiusKm;
    });
};

// Sort doctors by distance
export const sortByDistance = (doctors, userLocation) => {
    return doctors.map(doctor => {
        const distance = calculateDistance(
            userLocation,
            doctor.location?.coordinates || { lat: 0, lng: 0 }
        );
        return { ...doctor._doc, distance };
    }).sort((a, b) => a.distance - b.distance);
};

// Parse location query (city, area, or pincode)
export const parseLocationQuery = (query) => {
    const isPincode = /^\d{6}$/.test(query);

    if (isPincode) {
        return { pincode: query };
    } else {
        return {
            $or: [
                { 'location.city': { $regex: query, $options: 'i' } },
                { 'location.area': { $regex: query, $options: 'i' } }
            ]
        };
    }
};
