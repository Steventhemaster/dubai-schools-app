// Apply the app font (Plus Jakarta Sans, loaded in app/+html.tsx) globally on
// web. react-native-web injects an inline font on every <Text>/<TextInput>,
// which overrides the document font, so setting it on <body> alone has no
// effect. We can't override it with global CSS either, because icon fonts
// (Ionicons) use the same mechanism and would break.
//
// Instead we wrap each component's forwardRef render and inject the font ONLY
// when the element's style doesn't already declare a fontFamily. Icons set
// their own fontFamily, so they're left untouched.
import { Platform, StyleSheet, Text, TextInput } from 'react-native';

export const APP_FONT =
  "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif";

if (Platform.OS === 'web') {
  const patch = (Comp: any) => {
    const orig = Comp?.render;
    if (typeof orig !== 'function' || orig.__appFontPatched) return;
    const patched = function (props: any, ref: any) {
      const flat = StyleSheet.flatten(props?.style) || {};
      if (!flat.fontFamily) {
        props = { ...props, style: [props?.style, { fontFamily: APP_FONT }] };
      }
      return orig(props, ref);
    };
    patched.__appFontPatched = true;
    Comp.render = patched;
  };
  patch(Text);
  patch(TextInput);
}
