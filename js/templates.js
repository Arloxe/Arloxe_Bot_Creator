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

export function createDefaultPreset() {
  return {
    name: "New Template",
    temperature: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    top_p: 1,
    top_k: 0,
    top_a: 1,
    min_p: 0,
    repetition_penalty: 1,
    openai_max_context: 0,
    openai_max_tokens: 0,
    wrap_in_quotes: false,
    names_behavior: 0,
    send_if_empty: "",
    impersonation_prompt: "",
    new_chat_prompt: "",
    new_group_chat_prompt: "",
    new_example_chat_prompt: "",
    continue_nudge_prompt: "",
    bias_preset_selected: "Default (none)",
    max_context_unlocked: false,
    wi_format: "{0}\n",
    scenario_format: "{{scenario}}",
    personality_format: "{{personality}}",
    group_nudge_prompt: "",
    stream_openai: true,
    prompts: [],
    prompt_order: [],
    assistant_prefill: "",
    assistant_impersonation: "",
    claude_use_sysprompt: true,
    use_makersuite_sysprompt: true,
    squash_system_messages: false,
    image_inlining: true,
    inline_image_quality: "auto",
    video_inlining: true,
    audio_inlining: true,
    continue_prefill: false,
    continue_postfix: " ",
    function_calling: false,
    show_thoughts: false,
    reasoning_effort: "medium",
    enable_web_search: false,
    request_images: true,
    seed: -1,
    n: 1,
    extensions: {}
  };
}
