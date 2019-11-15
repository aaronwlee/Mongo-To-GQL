import { convertCapAndRemovePlural } from "./convertCap";

export default function convertType(type: any): String {
    const basic = ["String", "Date", "Number"];
    if (basic.includes(type.instance)) {
        if (type.instance === "Number") {
            return "Int"
        }
        else {
            return type.instance
        }
    }
    else if (type.instance === "Array") {
        if (basic.includes(type.caster.instance)) {
            if (type.caster.instance === "Number") {
                return '[Int]'
            }
            else {
                return `[${type.caster.instance}]`
            }

        }
        else {
            return `[${convertCapAndRemovePlural(type.path)}]`
        }
    }
    else if (type.instance === "ObjectID") {
        return convertCapAndRemovePlural(type.path)
    }
    else {
        return type.instance
    }
}