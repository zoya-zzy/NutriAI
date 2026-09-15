import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
# Never spend API credits or read a real key into tests.
os.environ.update(DASHSCOPE_API_KEY='', NUTRI_AI_MODEL='mock',
                  ALLOWED_ORIGINS='https://nutri-ai-zoya24.vercel.app', ALLOW_ALL_ORIGINS='false')
import main
from fastapi.testclient import TestClient
from model import FoodRecognitionResult
from nutrition_agent import ChatResult, AdviceResult

class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)

    def test_environment_takes_precedence_over_dotenv(self):
        self.assertEqual(os.environ['DASHSCOPE_API_KEY'], '')
        result = self.client.get('/api/health')
        self.assertEqual(result.status_code, 200)
        self.assertFalse(result.json()['aiConfigured'])
        self.assertEqual(result.json()['model'], 'mock')

    def test_vercel_cors_preflight(self):
        response = self.client.options('/api/chat', headers={
            'Origin': 'https://nutri-ai-zoya24.vercel.app',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['access-control-allow-origin'],
                         'https://nutri-ai-zoya24.vercel.app')

    def test_unlisted_origin_is_not_granted_cors(self):
        response = self.client.options('/api/chat', headers={
            'Origin': 'https://unlisted.example', 'Access-Control-Request-Method': 'POST'})
        self.assertNotIn('access-control-allow-origin', response.headers)

    def test_chat_and_advice_contracts(self):
        with patch.object(main, 'get_agent') as factory:
            factory.return_value.process_message.return_value = ChatResult(reply='hello', source='test')
            response = self.client.post('/api/chat', json={'message': 'hello'})
            self.assertTrue(response.json()['success'])
            self.assertEqual(response.json()['reply'], 'hello')
            factory.return_value.generate_advice.return_value = AdviceResult(summary='test', source='test')
            response = self.client.post('/api/nutrition-advice', json={
                'userProfile': {}, 'diary': {'meals': []}, 'nutrition': {}})
            self.assertEqual(response.json()['data']['summary'], 'test')

    def test_upload_contract(self):
        with patch.object(main, 'recognize_food', return_value=FoodRecognitionResult(
                food_name='apple', calories=95, protein=0.5, carbs=25, fat=0.3, confidence=0.9)):
            response = self.client.post('/api/recognize-food', files={'image': ('food.jpg', b'image', 'image/jpeg')})
            self.assertTrue(response.json()['success'])
            self.assertEqual(response.json()['foodName'], 'apple')

    def test_invalid_uploads_never_call_model(self):
        with patch.object(main, 'recognize_food') as model:
            for content, mime in [(b'', 'image/jpeg'), (b'bad', 'text/plain'), (b'x' * (10 * 1024 * 1024 + 1), 'image/jpeg')]:
                response = self.client.post('/api/recognize-food', files={'image': ('food.jpg', content, mime)})
                self.assertEqual(response.status_code, 400)
            model.assert_not_called()

    def test_provider_failure_is_not_a_successful_food_result(self):
        with patch.object(main, 'recognize_food', side_effect=RuntimeError('provider unavailable')):
            response = self.client.post('/api/recognize-food', files={'image': ('food.jpg', b'image', 'image/jpeg')})
            self.assertFalse(response.json()['success'])

if __name__ == '__main__':
    unittest.main()
