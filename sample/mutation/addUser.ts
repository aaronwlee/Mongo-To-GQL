import { Imutation, IreturnType, graphType, Icontext } from "../../src";

class AddUser implements Imutation {

  public inputType = {
    username: graphType.String,
    email: graphType.String,
    followers: graphType.Custom("FollowersInputType")
  };

  public FollowersInputType = {
    id: graphType.ID
  };

  public resolver = async (_: any, { input }: any, { user }: any): Promise<IreturnType> => {
    try {
      return {
        done: true,
        error: null
      }
    } catch (error) {
      return {
        done: false,
        error: error
      }
    }
  };
}
export default AddUser;
