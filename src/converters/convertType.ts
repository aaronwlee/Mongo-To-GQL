import { convertCapAndRemovePlural } from "./convertCap";
import { IgqlOption } from "../index";

export default function convertType(fieldName: string, type: any, gqlOption: IgqlOption): string {
  let populateOptions: any = []
  if (gqlOption && gqlOption.Populate) {
    gqlOption.Populate.forEach((options: any) => {
      if (typeof options === "object") {
        populateOptions.push(options.path)
      }
      else {
        populateOptions.push(options)
      }
    })
  }
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
      return `\t${fieldName}: Int\n`;
    }
    else {
      return `\t${fieldName}: ${type.instance}\n`;
    }
  }
  else if (type.instance === "Array") {
    if (basic.includes(type.caster.instance)) {
      if (type.caster.instance === "Number") {
        return `\t${fieldName}: [Int]\n`
      }
      else if (noSupportToNumber.includes(type.instance)) {
        return `\t${fieldName}: [Int]\n`
      }
      else if (noSupportToJSON.includes(type.instance)) {
        return `\t${fieldName}: JSON\n`
      }
      else {
        return `\t${fieldName}: [${type.caster.instance}]\n`;
      }

    }
    else {
      if(populateOptions.includes(fieldName)) {
        return `\t${fieldName}: [${convertCapAndRemovePlural(type.caster.options.ref)}]\n`;
      }
      return `\t${fieldName}: [ID]\n`;
    }
  }
  else if (noSupportToNumber.includes(type.instance)) {
    return `\t${fieldName}: Int\n`;
  }
  else if (noSupportToJSON.includes(type.instance)) {
    return `\t${fieldName}: JSON\n`
  }
  else if (type.instance === "ObjectID") {
    if(populateOptions.includes(fieldName)) {
      return `\t${fieldName}: ${convertCapAndRemovePlural(type.options.ref)}\n`;
    }
    return `\t${fieldName}: ID\n`;
  }
  return `\t${fieldName}: [${type.instance}]\n`;
}