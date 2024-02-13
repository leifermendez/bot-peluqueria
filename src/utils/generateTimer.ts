function generateTimer(min: number, max: number) {
    const numSal = Math.random();

    const numeroAleatorio = Math.floor(numSal * (max - min + 1)) + min;

    return numeroAleatorio;
}

export { generateTimer };