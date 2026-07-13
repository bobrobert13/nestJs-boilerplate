// eslint-rules/require-public-jsdoc.js
//
// Regla custom: obliga a que metodos publicos de clases tengan JSDoc.
// Documentacion: openspec/changes/documentation-llm-readiness-audit/design.md

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Requiere JSDoc en metodos publicos de clases exportadas.",
    },
    messages: {
      missingJsdoc: "El metodo publico {{name}} no tiene JSDoc. Agrega un bloque /** ... */ antes del metodo.",
    },
    schema: [],
  },
  create(context) {
    function hasJSDocBefore(node) {
      const sourceCode = context.sourceCode || context.getSourceCode();
      const comments = sourceCode.getCommentsBefore(node);
      for (const c of comments) {
        if (c.type === "Block" && c.value.startsWith("*")) return true;
      }
      return false;
    }
    return {
      MethodDefinition(node) {
        if (node.accessibility === "private" || node.accessibility === "protected") return;
        if (node.static && node.computed) return;
        if (!node.value || node.value.type !== "FunctionExpression") return;
        if (hasJSDocBefore(node)) return;
        const name = node.key && node.key.name ? node.key.name : "(anonymous)";
        context.report({ node, messageId: "missingJsdoc", data: { name } });
      },
    };
  },
};
