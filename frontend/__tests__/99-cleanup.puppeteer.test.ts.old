import dotenv from 'dotenv';
import { deleteExistingTestUser, deleteTestUserFile, expectingToTakeSeconds } from './testutils';
dotenv.config();
  
describe('Test cleanup', () => {
    it('should delete the test user from the backend', async () => {
        await deleteExistingTestUser();
    }, expectingToTakeSeconds(1));

    it('should delete the test user file', async () => {
        await deleteTestUserFile();
    }, expectingToTakeSeconds(1));
});