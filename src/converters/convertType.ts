import { convertCapAndRemovePlural } from "./convertCap";

export default function convertType(type: any): string {
  const basic = ["String", "Date", "Number", "Boolean"];
  const noSupportToNumber = [
    "Buffer",
    "Decimal128",
  ]
  const noSupportToJSON = [
    "Map",
    "Mixed"
  ]
  if (basic.includes(type.instance)) {
    if (type.instance === "Number") {
      return "Int";
    }
    else {
      return type.instance;
    }
  }
  else if (type.instance === "Array") {
    if (basic.includes(type.caster.instance)) {
      if (type.caster.instance === "Number") {
        return "[Int]";
      }
      else if (noSupportToNumber.includes(type.instance)) {
        return "[Int]"
      }
      else if (noSupportToJSON.includes(type.instance)) {
        return "JSON"
      }
      else {
        return `[${type.caster.instance}]`;
      }

    }
    else {
      return `[${convertCapAndRemovePlural(type.caster.options.ref)}]`;
    }
  }
  else if (noSupportToNumber.includes(type.instance)) {
    return "Int"
  }
  else if (noSupportToJSON.includes(type.instance)) {
    return "JSON"
  }
  else if (type.instance === "ObjectID") {
    return convertCapAndRemovePlural(type.options.ref);
  }
  else {
    return type.instance;
  }
}