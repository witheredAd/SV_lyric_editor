<script setup lang="ts">
import { Button } from 'primevue';
import { ref, type Component } from 'vue';


type HintedString<T extends string> = (string & {}) | T;

interface ButtonProps {
    /**
     * Style class of the button.
     */
    class?: any;
    /**
     * Text of the button.
     */
    label?: string | undefined;
    /**
     * Name of the icon.
     */
    icon?: string | undefined;
    /**
     * Position of the icon.
     * @defaultValue left
     */
    iconPos?: 'left' | 'right' | 'top' | 'bottom' | undefined;
    /**
     * Style class of the icon.
     */
    iconClass?: string | object | undefined;
    /**
     * Value of the badge.
     */
    badge?: string | undefined;
    /**
     * Style class of the badge.
     */
    badgeClass?: string | object | undefined;
    /**
     * Severity type of the badge.
     */
    badgeSeverity?: HintedString<'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast'> | null | undefined;
    /**
     * Whether the button is in loading state.
     * @defaultValue false
     */
    loading?: boolean | undefined;
    /**
     * Icon to display in loading state.
     */
    loadingIcon?: string | undefined;
    /**
     * Use to change the HTML tag of root element.
     * @defaultValue BUTTON
     */
    as?: string | Component | undefined;
    /**
     * When enabled, it changes the default rendered element for the one passed as a child element.
     * @defaultValue false
     */
    asChild?: boolean | undefined;
    /**
     *  Add a link style to the button.
     * @defaultValue false
     */
    link?: boolean | undefined;
    /**
     * Defines the style of the button.
     */
    severity?: HintedString<'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast'> | undefined;
    /**
     * Add a shadow to indicate elevation.
     * @defaultValue false
     */
    raised?: boolean | undefined;
    /**
     * Add a circular border radius to the button.
     * @defaultValue false
     */
    rounded?: boolean | undefined;
    /**
     * Add a textual class to the button without a background initially.
     * @defaultValue false
     */
    text?: boolean | undefined;
    /**
     * Add a border class without a background initially.
     * @defaultValue false
     */
    outlined?: boolean | undefined;
    /**
     * Defines the size of the button.
     */
    size?: 'small' | 'large' | undefined;
    /**
     * Specifies the variant of the component.
     * @defaultValue undefined
     */
    variant?: 'outlined' | 'text' | 'link' | undefined;
    /**
     * Add a plain textual class to the button without a background initially.
     * @defaultValue false
     * @deprecated since v4.2.0. Use a contrast severity instead.
     */
    plain?: boolean | undefined;
    /**
     * Spans 100% width of the container when enabled.
     * @defaultValue null
     */
    fluid?: boolean | undefined;
}

const props = defineProps<ButtonProps & {
    click: () => Promise<any>
}>()

const loading = ref(false)

const onClick = () => {
    loading.value = true
    console.log(props.click)
    props.click().finally(() => {
        loading.value = false
    })
}

</script>

<template>
  <Button :label="label" :icon="icon" :severity="severity"
    :loading="loading" @click="onClick"
  />
</template>