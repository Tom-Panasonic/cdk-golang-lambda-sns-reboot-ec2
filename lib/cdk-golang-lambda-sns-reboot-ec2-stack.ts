import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import * as fs from "fs";

export class CdkGolangLambdaSnsRebootEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // os_version.jsonからEC2インスタンスIDとSNSトピックARNを読み込む
    const config = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "os_version.json"), "utf8")
    );
    const instanceId = config.instanceId;
    const snsTopicArn = config.snsTopicArn;
    const cloudwatchAlarmName = config.cloudwatchAlarmName; // Create IAM role for Lambda
    const lambdaRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    // Add EC2 reboot permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:RebootInstances"],
        resources: ["*"],
      })
    );

    // Add SNS publish permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["sns:Publish"],
        resources: [snsTopicArn],
      })
    );

    // Create Lambda function
    const rebootLambda = new lambda.Function(this, "RebootEc2LambdaFunction", {
      runtime: lambda.Runtime.PROVIDED_AL2,
      handler: "bootstrap",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda"), {
        bundling: {
          image: lambda.Runtime.PROVIDED_AL2.bundlingImage,
          command: [
            "bash",
            "-c",
            "GOOS=linux GOARCH=amd64 go build -o /asset-output/bootstrap main.go",
          ],
          user: "root",
        },
      }),
      role: lambdaRole,
      environment: {
        INSTANCE_ID: instanceId,
        SNS_TOPIC_ARN: snsTopicArn,
      },
      timeout: cdk.Duration.seconds(30),
      description:
        "Lambda function to reboot EC2 instance and notify via SNS with Golang And CDK",
    });

    // Output the Lambda function name
    new cdk.CfnOutput(this, "LambdaFunctionName", {
      value: rebootLambda.functionName,
      description: "Lambda function name for EC2 reboot",
    });

    // Output the Lambda function ARN
    new cdk.CfnOutput(this, "LambdaFunctionArn", {
      value: rebootLambda.functionArn,
      description: "Lambda function ARN",
    });

    // Grant CloudWatch Alarms permission to invoke Lambda directly
    rebootLambda.addPermission("AllowCloudWatchAlarmsInvoke", {
      principal: new iam.ServicePrincipal(
        "lambda.alarms.cloudwatch.amazonaws.com"
      ),
      action: "lambda:InvokeFunction",
      sourceAccount: this.account,
      sourceArn: `arn:aws:cloudwatch:${this.region}:${this.account}:alarm:${cloudwatchAlarmName}`,
    });

    // Output the CloudWatch Alarm ARN
    new cdk.CfnOutput(this, "CloudWatchAlarmArn", {
      value: `arn:aws:cloudwatch:${this.region}:${this.account}:alarm:${cloudwatchAlarmName}`,
      description: "CloudWatch Alarm ARN that can trigger this Lambda",
    });

    // Output message for manual setup
    new cdk.CfnOutput(this, "ManualSetupInstructions", {
      value: `Lambda is now ready to be triggered by CloudWatch Alarm: ${cloudwatchAlarmName}`,
      description: "Next steps",
    });
  }
}
