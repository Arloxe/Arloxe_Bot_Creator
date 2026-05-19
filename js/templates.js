export function createDefaultCard() {
  return {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: "",
      description: "",
      personality: "",
      scenario: "",
      first_mes: "",
      mes_example: "",

      creator_notes: "",
      system_prompt: "",
      post_history_instructions: "",
      alternate_greetings: [],

      tags: [],
      creator: "",
      character_version: "",

      extensions: {}
    }
  };
}

export function createDefaultLorebook() {
  return {
    name: "",
    description: "",
    scan_depth: 2,
    token_budget: 500,
    recursive_scanning: false,
    extensions: {},
    entries: []
  };
}

export function createDefaultLorebookEntry(id = Date.now()) {
  return {
    keys: [],
    secondary_keys: [],
    content: "",
    enabled: true,
    insertion_order: 100,
    case_sensitive: false,
    name: "",
    priority: 100,
    id,
    comment: "",
    selective: false,
    constant: false,
    position: "before_char",
    extensions: {}
  };
}
