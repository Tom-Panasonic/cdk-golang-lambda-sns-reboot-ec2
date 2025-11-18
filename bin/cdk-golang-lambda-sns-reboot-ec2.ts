#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkGolangLambdaSnsRebootEc2Stack } from "../lib/cdk-golang-lambda-sns-reboot-ec2-stack";

const app = new cdk.App();
new CdkGolangLambdaSnsRebootEc2Stack(app, "CdkGolangLambdaSnsRebootEc2Stack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
