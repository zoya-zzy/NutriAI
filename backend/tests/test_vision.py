import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch, Mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import model

# Fixture values test data transport, not real-world nutritional accuracy.
MILK = dict(isFood=True, foodName="Milk", calories=150, protein=8, carbs=12,
            fat=8, confidence=0.8, servingDescription="250 ml", estimateNote="Assumed portion")
JPEG = b"\xff\xd8\xff" + b"fixture"

class VisionTests(unittest.TestCase):
    def test_dashscope_text_blocks(self):
        value = model._recognition_result([{"text": json.dumps(MILK)}])
        self.assertEqual(value.calories, 150)
        self.assertEqual(value.serving_description, "250 ml")

    def test_text_fences_and_split_blocks(self):
        text = json.dumps(MILK)
        for content in [text, "```json\n" + text + "\n```", [{"text": text[:15]}, {"text": text[15:]}]]:
            self.assertEqual(model._recognition_result(content).food_name, "Milk")

    def test_http_path_accepts_real_dashscope_shape(self):
        response = Mock()
        response.json.return_value = {"output": {"choices": [{"message": {"content": [{"text": json.dumps(MILK)}]}}]}}
        with patch('requests.post', return_value=response) as post:
            result = model.recognize_food_qwen_vl_http(JPEG, 'test-key')
            self.assertEqual(result.calories, 150)
            payload = post.call_args.kwargs['json']
            self.assertTrue(payload['input']['messages'][0]['content'][0]['image'].startswith('data:image/jpeg;base64,'))

    def test_sdk_path_uses_same_parser(self):
        sdk = Mock()
        sdk.MultiModalConversation.call.return_value = Mock(status_code=200,
            output=Mock(choices=[Mock(message=Mock(content=[{"text": json.dumps(MILK)}]))]))
        with patch.dict(sys.modules, {'dashscope': sdk}):
            self.assertEqual(model.recognize_food_qwen_vl_plus(JPEG, 'test-key').calories, 150)

    def test_no_food_and_bad_results_never_become_zero_calories(self):
        for content in ['Not a food', '[]', '[1]', [], [{"image": "ignored"}], '{"isFood":false}',
                        '{"foodName":"Milk"}', '{"foodName":"Unknown Food"}']:
            with self.subTest(content=content), self.assertRaises(ValueError):
                model._recognition_result(content)

    def test_invalid_numbers_are_rejected(self):
        for field, value in [('calories', None), ('protein', -1), ('fat', 'NaN'),
                             ('carbs', 'Infinity'), ('confidence', 1.5), ('calories', True)]:
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                model._recognition_result(json.dumps({**MILK, field: value}))

    def test_zero_calorie_water_remains_valid(self):
        data = {**MILK, 'foodName': 'Water', 'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0}
        self.assertEqual(model._recognition_result(json.dumps(data)).calories, 0)

    def test_mime_matches_binary_format(self):
        for data, mime in [(JPEG, 'image/jpeg'), (b'\x89PNG\r\n\x1a\n', 'image/png'),
                           (b'RIFF0000WEBP', 'image/webp'), (b'GIF89a', 'image/gif')]:
            self.assertEqual(model._image_mime(data), mime)
        with self.assertRaises(ValueError):
            model._image_mime(b'not an image')

if __name__ == '__main__':
    unittest.main()
