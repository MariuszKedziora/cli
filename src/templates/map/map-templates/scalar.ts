export default `{{#if fieldName}}{{fieldName}}{{use}} {{/if}}{{>Value type=scalarType}}, // {{#if required}}required {{/if }}{{#unless required }}optional {{/unless }}{{scalarType}}`;
