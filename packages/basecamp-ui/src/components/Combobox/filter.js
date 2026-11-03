export const normalize = (text) => text.trim().toLocaleLowerCase()

export const defaultFilter = (option, query) => normalize(option.label).includes(normalize(query))
