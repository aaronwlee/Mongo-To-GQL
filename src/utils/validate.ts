export function virtualsValidate(model: any) {
  const errors = []
  if (Object.keys(model.schema.virtuals).length > 1) {
    if (Object.keys(model.schema.options).includes("toObject")) {
      if (!model.schema.options.toObject.virtuals) {
        errors.push(`'toObject: { virtuals: true }' is missing in your ${model.modelName}'s schema options`)
      }
    }
    else {
      errors.push(`'toObject: { virtuals: true }' is missing in your ${model.modelName}'s schema options`)
    }
    if (Object.keys(model.schema.options).includes("toJSON")) {
      if (!model.schema.options.toJSON.virtuals) {
        errors.push(`'toJSON: { virtuals: true }' is missing in your ${model.modelName}'s schema options`)
      }
    }
    else {
      errors.push(`'toJSON: { virtuals: true }' is missing in your ${model.modelName}'s schema options`)
    }

    if (errors.length > 0) {
      errors.push(`Mongo to gql has found some virutal fields but the options are required!`)
    }
  }
  return errors;
}
