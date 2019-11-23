export const convertCapAndRemovePlural = (fieldName: string) => {
  let newFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase();
  if (newFieldName[newFieldName.length - 1] === "s") {
    newFieldName = newFieldName.slice(0, newFieldName.length - 1);
  }
  return newFieldName;
};

export const convertFirstLowercase = (fieldName: string) => {
  let newFieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
  return newFieldName;
};

export const convertFirstUppercase = (fieldName: string) => {
  let newFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  return newFieldName;
};

export const convertCapAndAddPlural = (fieldName: any) => {
  let newFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).toLowerCase();
  if (newFieldName[newFieldName.length - 1] !== "s") {
    newFieldName += "s";
  }
  return newFieldName;
};