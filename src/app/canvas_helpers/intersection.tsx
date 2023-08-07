export namespace Intersection {
    export const DIST = 20;

    const distSquared = (pointA: [number, number], pointB: [number, number]) => {
        const deltaX = pointA[0] - pointB[0];
        const deltaY = pointA[1] - pointB[1];
        return deltaX * deltaX + deltaY * deltaY; 
    };

    const withinDistance = (pointA: [number, number], pointB: [number, number], dist: number) => {
        return distSquared(pointA, pointB) < dist * dist;
    };

    export const closestLinePoint = (linePointA: [number, number], linePointB: [number, number], soloPoint: [number, number]): [number, number] => {
        const lineVector = [linePointB[0] - linePointA[0], linePointB[1] - linePointA[1]];
        const pointVector = [soloPoint[0] - linePointA[0], soloPoint[1] - linePointA[1]];
        const dotprod = lineVector[0] * pointVector[0] + lineVector[1] * pointVector[1];
        const lineVectorNorm = lineVector[0] * lineVector[0] + lineVector[1] + lineVector[1];

        if (lineVectorNorm === 0) return linePointA;

        const t = dotprod / lineVectorNorm;
        if (t >= 0 && t <= 1) return [t * lineVector[0] + linePointA[0], t * lineVector[1] + linePointA[1]];
        else if (t < 0) return linePointA;
        else return linePointB;
    };

    export const isIntersecting = (point: [number, number], path: [number, number][]) => {
        return path.some((pathPoint, index) => {
            if (index + 1 >= path.length) return false;
            const closestPoint = closestLinePoint(pathPoint, path[index + 1], point);
            return withinDistance(closestPoint, point, DIST);
        });
    };
    
};
