export default function pathJoin(a: string, b: string) {
    return a === "/" ? "/" + b : (a || "") + "/" + b;
}
