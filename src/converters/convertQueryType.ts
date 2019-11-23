export default function convertQueryType(fieldName: string, type: any): string {
  let returnString: string = "";
  if (type.instance === "Date") {
    returnString += `\t${fieldName}_gt: Date\n`;
    returnString += `\t${fieldName}_gte: Date\n`;
    returnString += `\t${fieldName}_lt: Date\n`;
    returnString += `\t${fieldName}_lte: Date\n`;
  }
  else {
    returnString += `\t${fieldName}: String\n`;
    returnString += `\t${fieldName}_ne: String\n`;
    returnString += `\t${fieldName}_in: [String!]\n`;
    returnString += `\t${fieldName}_has: String\n`;
  }
  return returnString;
}