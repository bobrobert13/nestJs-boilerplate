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
      missingJsdoc:
        "El metodo publico {{name}} no tiene JSDoc. Agrega un bloque /** ... */ antes del metodo.",
    },
    schema: [],
  },
  create(context) {
    function hasJSDocBefore(node) {
      const sourceCode = context.sourceCode || context.getSourceCode();
      // Some decorators sit between comments and the method. Use
      // `getCommentsBefore` on the AST node which captures ALL comments
      // before the method start, irrespective of intervening decorators.
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
        // Constructors are object lifecycle; documenting them with
        // "Lifts DI dependencies" adds noise. The class itself carries
        // JSDoc on the relevant services, so skip the rule for them.
        if (node.kind === "constructor") return;
        if (hasJSDocBefore(node)) return;
        const name = node.key && node.key.name ? node.key.name : "(anonymous)";
        context.report({ node, messageId: "missingJsdoc", data: { name } });
      },
    };
  },
};
