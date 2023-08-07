export namespace CanvasMatrix {
    /**
     * Multiplies two matrices.
     * 
     * @param matrixA Left matrix, entries in column-major order, omit last row
     * @param matrixB Right matrix, entries in column-major order, omit last row
     */
    export const matmul = (matrixA: Array<number>, matrixB: Array<number>) => {
        return [
            matrixA[0] * matrixB[0] + matrixA[2] * matrixB[1], 
            matrixA[1] * matrixB[0] + matrixA[3] * matrixB[1], 
            matrixA[0] * matrixB[2] + matrixA[2] * matrixB[3], 
            matrixA[1] * matrixB[2] + matrixA[3] * matrixB[3], 
            matrixA[0] * matrixB[4] + matrixA[2] * matrixB[5] + matrixA[4], 
            matrixA[1] * matrixB[4] + matrixA[3] * matrixB[5] + matrixA[5], 
        ];
    }

    export const matmul_multiple = (...matrices: number[][]): number[] => {
        return matrices.reduceRight(
            (accumulator, current) => matmul(current, accumulator)
        );
    }

    export const scale = (factor: number) => {
        return [factor, 0, 0, factor, 0, 0];
    }

    export const translate = (offsetX: number, offsetY: number) => {
        return [1, 0, 0, 1, offsetX, offsetY];
    }
}